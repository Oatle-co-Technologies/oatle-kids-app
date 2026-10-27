// Match a server-owned grant to the currently signed-in account.
export function hasActiveEntitlement(entitlement, userId, now = Date.now()) {
  if (!userId || entitlement?.user_id !== userId || entitlement.status !== "active") return false;
  if (entitlement.expires_at === null) return true;
  const expiresAt = Date.parse(entitlement.expires_at);
  return Number.isFinite(expiresAt) && expiresAt > now;
}
