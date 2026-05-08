/**
 * Nettoie l’e-mail saisi : espaces, caractères invisibles, normalisation Unicode.
 * Utile quand Supabase renvoie « Email address … is invalid » à cause d’un caractère parasite.
 */
export function normalizeEmailInput(raw: string): string {
  return raw
    .normalize('NFKC')
    .trim()
    .replace(/[\u200B-\u200D\uFEFF\u00A0\u200E\u200F]/g, '')
    .replace(/\s+/g, '')
    .toLowerCase();
}
