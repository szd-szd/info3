#!/usr/bin/env node
/**
 * Crée un utilisateur Auth + profil RH (role = rh) via l’API Admin Supabase.
 *
 * Prérequis : clé **service_role** (Settings → API → service_role) — ne jamais la mettre dans le frontend.
 *
 * Usage :
 *   SUPABASE_URL="https://xxxx.supabase.co" \
 *   SUPABASE_SERVICE_ROLE_KEY="eyJ..." \
 *   ADMIN_EMAIL="rh@entreprise.com" \
 *   ADMIN_PASSWORD="MotDePasseSecurise123!" \
 *   node scripts/create-rh-admin.mjs
 */

const urlRaw = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

function usage() {
  console.error(`
Création d’un compte administrateur (RH)

Variables d’environnement obligatoires :
  SUPABASE_URL                 URL du projet (ex. https://xxx.supabase.co)
  SUPABASE_SERVICE_ROLE_KEY    clé service_role (dashboard → Settings → API)
  ADMIN_EMAIL                  adresse du compte RH
  ADMIN_PASSWORD               mot de passe (min. 6 caractères, selon politique Supabase)

Exemple :
  SUPABASE_URL="https://abcd.supabase.co" \\
  SUPABASE_SERVICE_ROLE_KEY="eyJhbG..." \\
  ADMIN_EMAIL="rh@monentreprise.com" \\
  ADMIN_PASSWORD="ChangeMoi123!" \\
  node scripts/create-rh-admin.mjs
`);
}

if (!urlRaw?.trim() || !serviceKey?.trim() || !email?.trim() || !password) {
  usage();
  process.exit(1);
}

const base = urlRaw.trim().replace(/\/+$/, '');
const adminEmail = email.trim().toLowerCase();

async function createUser() {
  const res = await fetch(`${base}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: adminEmail,
      password,
      email_confirm: true,
    }),
  });
  const body = await res.json().catch(() => ({}));
  return { res, body };
}

async function promoteProfile(userId) {
  const res = await fetch(`${base}/rest/v1/profiles?user_id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ role: 'rh', employee_id: null }),
  });
  const text = await res.text();
  return { res, text };
}

async function main() {
  let { res, body } = await createUser();

  if (res.status === 422 || body?.msg?.toLowerCase?.()?.includes?.('already')) {
    console.error(
      'Un utilisateur avec cet e-mail existe déjà. Dans Supabase → SQL Editor :\n\n' +
        `  update public.profiles\n` +
        `  set role = 'rh', employee_id = null\n` +
        `  where user_id = (select id from auth.users where email = '${adminEmail.replace(/'/g, "''")}' limit 1);\n`
    );
    process.exit(1);
  }

  if (!res.ok) {
    console.error('Erreur création utilisateur (Auth admin) :', res.status, body);
    process.exit(1);
  }

  const userId = body.id;
  if (!userId) {
    console.error('Réponse inattendue (pas d’id) :', body);
    process.exit(1);
  }

  const { res: patchRes, text } = await promoteProfile(userId);
  if (!patchRes.ok) {
    console.error('Utilisateur créé mais erreur mise à jour profil RH :', patchRes.status, text);
    console.error('Corrigez manuellement avec :\n  update public.profiles set role = \'rh\', employee_id = null where user_id = \'' + userId + '\';');
    process.exit(1);
  }

  console.log('Compte administrateur (RH) prêt.');
  console.log('  E-mail   :', adminEmail);
  console.log('  user_id :', userId);
  console.log('Connectez-vous sur l’app avec cet e-mail et ce mot de passe.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
