/** Server-side admin email check (security boundary) */
export function isAdminEmail(email: string | undefined): boolean {
  if (!email) return false
  return email.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase()
}

/** Client-side admin email check (UI only, NOT a security boundary) */
export function isAdminClient(email: string | undefined): boolean {
  if (!email) return false
  return email.toLowerCase() === process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase()
}
