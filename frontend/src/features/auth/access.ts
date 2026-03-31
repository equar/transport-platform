import type { AuthSession } from "./types";

export const roleLabels: Record<string, string> = {
  ROLE_PLATFORM_ADMIN: "Platform Admin",
  ROLE_TENANT_ADMIN: "Company Admin",
  ROLE_DISPATCHER: "Dispatcher",
  ROLE_DRIVER: "Driver",
  ROLE_RIDER: "Rider",
  ROLE_GUARDIAN: "Guardian",
  ROLE_ORGANIZATION_USER: "Organization User",
  ROLE_VIEWER: "Viewer",
};

export function hasRole(session: AuthSession | null, role: string) {
  return Boolean(session?.identity.roles.includes(role));
}

export function isPlatformAdmin(session: AuthSession | null) {
  return hasRole(session, "ROLE_PLATFORM_ADMIN");
}

export function isCompanyAdmin(session: AuthSession | null) {
  return hasRole(session, "ROLE_TENANT_ADMIN");
}

export function isDriverPortalUser(session: AuthSession | null) {
  return hasRole(session, "ROLE_DRIVER") && !isCompanyAdmin(session);
}

export function isRiderPortalUser(session: AuthSession | null) {
  return hasRole(session, "ROLE_RIDER");
}

export function isGuardianPortalUser(session: AuthSession | null) {
  return hasRole(session, "ROLE_GUARDIAN");
}

export function isOrganizationPortalUser(session: AuthSession | null) {
  return hasRole(session, "ROLE_ORGANIZATION_USER");
}

export function getDefaultRoute(session: AuthSession | null) {
  if (isPlatformAdmin(session)) {
    return "/platform";
  }
  if (isCompanyAdmin(session)) {
    return "/company";
  }
  if (isDriverPortalUser(session)) {
    return "/portal/driver";
  }
  if (isRiderPortalUser(session) || isGuardianPortalUser(session)) {
    return "/portal/rider";
  }
  if (isOrganizationPortalUser(session)) {
    return "/portal/organization";
  }
  return "/login";
}

export function getRoleLabel(role: string) {
  return roleLabels[role] ?? role.replace(/^ROLE_/, "").replaceAll("_", " ");
}