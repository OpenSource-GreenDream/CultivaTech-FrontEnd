export function normalizeRoles(roles: readonly string[] | null | undefined): string[] {
  return (roles ?? []).map((role) => String(role || '').trim().toUpperCase()).filter(Boolean);
}

export function hasRole(roles: readonly string[] | null | undefined, role: string): boolean {
  return normalizeRoles(roles).includes(role.toUpperCase());
}

export function canAccessAgriculturalModules(roles: readonly string[] | null | undefined): boolean {
  const normalized = normalizeRoles(roles);
  return normalized.includes('ADMIN') || normalized.includes('FARMER');
}

export function canManageInventory(roles: readonly string[] | null | undefined): boolean {
  return canAccessAgriculturalModules(roles);
}

export function canManageFields(roles: readonly string[] | null | undefined): boolean {
  return canAccessAgriculturalModules(roles);
}

export function canPublishProducts(roles: readonly string[] | null | undefined): boolean {
  return canAccessAgriculturalModules(roles);
}

export function canAccessCatalog(roles: readonly string[] | null | undefined): boolean {
  return true;
}

export function canAccessCommunity(roles: readonly string[] | null | undefined): boolean {
  return true;
}

export function canAccessProfile(roles: readonly string[] | null | undefined): boolean {
  return true;
}

export function canAccessNotifications(roles: readonly string[] | null | undefined): boolean {
  return canAccessAgriculturalModules(roles);
}