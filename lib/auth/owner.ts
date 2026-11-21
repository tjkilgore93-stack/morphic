/**
 * Explicit, server-side owner allowlist.
 *
 * Configure MORPHIC_OWNER_USER_IDS with comma-separated authenticated app user
 * IDs. Do not use client-supplied claims, email addresses, or provider roles:
 * IDs are stable across email changes and are resolved from the auth provider.
 */
export function isOwnerUser(userId: string | null | undefined): boolean {
  if (!userId) return false

  const configuredIds = process.env.MORPHIC_OWNER_USER_IDS
  if (!configuredIds) return false

  return configuredIds
    .split(',')
    .map(id => id.trim())
    .filter(Boolean)
    .includes(userId)
}
