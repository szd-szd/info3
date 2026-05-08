-- =============================================================================
-- Compte administrateur (RH) — à exécuter dans Supabase → SQL Editor
-- =============================================================================
-- 1) Modifiez UNIQUEMENT les deux lignes ci-dessous (e-mail + mot de passe).
-- 2) Exécutez tout le script d’un coup (Run).
--
-- Si l’e-mail existe déjà dans Auth : le profil est seulement passé en role « rh ».
-- Sinon : création dans auth.users + auth.identities + profil RH.
--
-- Évitez un e-mail identique à une ligne de public.employees si vous ne voulez pas
-- que le trigger lie ce compte à une fiche employé avant la mise à jour RH
-- (le script remet quand même employee_id à NULL pour un RH).
-- =============================================================================

create extension if not exists pgcrypto;

do $$
declare
  admin_email    text := 'admin@info1.com';  -- ← votre e-mail admin
  admin_password text := '12345678';   -- ← mot de passe (changez-le)
  v_user_id        uuid;
  v_crypt          text;
begin
  -- Utilisateur déjà présent : promotion RH uniquement
  select id into v_user_id
  from auth.users
  where lower(email) = lower(admin_email)
  limit 1;

  if v_user_id is not null then
    update public.profiles
    set role = 'rh', employee_id = null
    where user_id = v_user_id;

    raise notice 'Compte existant : profil RH appliqué pour % (user_id=%)', admin_email, v_user_id;
    return;
  end if;

  v_user_id := gen_random_uuid();
  v_crypt     := crypt(admin_password, gen_salt('bf'));

  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    lower(admin_email),
    v_crypt,
    now(),
    null,
    '',
    null,
    '',
    null,
    '',
    '',
    null,
    null,
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    null,
    now(),
    now(),
    null,
    null,
    '',
    '',
    null,
    '',
    0,
    null,
    '',
    null,
    false
  );

  insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    gen_random_uuid(),
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', lower(admin_email)),
    'email',
    v_user_id::text,
    now(),
    now(),
    now()
  );

  update public.profiles
  set role = 'rh', employee_id = null
  where user_id = v_user_id;

  raise notice 'Compte RH créé : % (user_id=%)', admin_email, v_user_id;
end $$;
