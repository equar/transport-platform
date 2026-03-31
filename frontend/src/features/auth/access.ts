import type { AuthSession } from "./types";

export const roleLabels: Record<string, string> = {
  ROLE_PLATFORM_ADMIN: "Platform Admin",
  ROLE_TENANT_ADMIN: "Company Admin",
  ROLE_DISPATCHER: "Dispatcher",
  ROLE_DRIVER: "Driver",
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

export function getDefaultRoute(session: AuthSession | null) {
  if (isPlatformAdmin(session)) {
    return "/platform";
  }
  if (isCompanyAdmin(session)) {
    return "/company";
  }
  return "/login";
}

export function getRoleLabel(role: string) {
  return roleLabels[role] ?? role.replace(/^ROLE_/, "").replaceAll("_", " ");
}