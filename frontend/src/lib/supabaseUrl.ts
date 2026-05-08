/** Nettoie VITE_SUPABASE_URL (copier-coller depuis le dashboard). */
export function normalizeSupabaseProjectUrl(raw: string | undefined): string {
  if (!raw) return '';
  let u = raw.trim();
  if ((u.startsWith('"') && u.endsWith('"')) || (u.startsWith("'") && u.endsWith("'"))) {
    u = u.slice(1, -1).trim();
  }
  u = u.replace(/\/+$/, '');
  // Parfois on colle l’URL REST au lieu de la racine du projet
  for (const suffix of ['/rest/v1', '/auth/v1', '/storage/v1', '/realtime/v1']) {
    const i = u.toLowerCase().indexOf(suffix.toLowerCase());
    if (i !== -1) u = u.slice(0, i);
  }
  return u.replace(/\/+$/, '');
}

export function authEmailRedirectUrl(): string {
  if (typeof window === 'undefined') return '';
  const o = window.location.origin.replace(/\/+$/, '');
  return `${o}/login`;
}
