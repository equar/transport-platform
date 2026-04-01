import type { AuthSession } from "./types";

export type PrivateAppScope =
  | "platform"
  | "company"
  | "driver"
  | "rider"
  | "organization";

const canonicalRoleAliases: Record<string, string[]> = {
  ROLE_PLATFORM_ADMIN: ["ROLE_PLATFORM_ADMIN", "PLATFORM_ADMIN", "SUPER_ADMIN"],
  ROLE_TENANT_ADMIN: ["ROLE_TENANT_ADMIN", "COMPANY_ADMIN", "COMPANY_OWNER"],
  ROLE_DISPATCHER: ["ROLE_DISPATCHER", "DISPATCHER"],
  ROLE_BILLING_ADMIN: ["ROLE_BILLING_ADMIN", "BILLING_ADMIN"],
  ROLE_COMPLIANCE_ADMIN: ["ROLE_COMPLIANCE_ADMIN", "COMPLIANCE_ADMIN"],
  ROLE_DRIVER: ["ROLE_DRIVER", "DRIVER"],
  ROLE_RIDER: ["ROLE_RIDER", "RIDER"],
  ROLE_GUARDIAN: ["ROLE_GUARDIAN", "GUARDIAN"],
  ROLE_ORGANIZATION_USER: ["ROLE_ORGANIZATION_USER", "ORGANIZATION_USER"],
  ROLE_VIEWER: ["ROLE_VIEWER", "VIEWER"],
};

const privateScopeRoots: Record<PrivateAppScope, string> = {
  platform: "/platform",
  company: "/company",
  driver: "/portal/driver",
  rider: "/portal/rider",
  organization: "/portal/organization",
};

const publicOnlyRoutes = new Set([
  "/",
  "/login",
  "/forgot-password",
  "/reset-password",
  "/unauthorized",
]);

export const roleLabels: Record<string, string> = {
  ROLE_PLATFORM_ADMIN: "Platform Admin",
  PLATFORM_ADMIN: "Platform Admin",
  SUPER_ADMIN: "Platform Admin",
  ROLE_TENANT_ADMIN: "Company Admin",
  COMPANY_ADMIN: "Company Admin",
  COMPANY_OWNER: "Company Admin",
  ROLE_DISPATCHER: "Dispatcher",
  DISPATCHER: "Dispatcher",
  ROLE_BILLING_ADMIN: "Billing Admin",
  BILLING_ADMIN: "Billing Admin",
  ROLE_COMPLIANCE_ADMIN: "Compliance Admin",
  COMPLIANCE_ADMIN: "Compliance Admin",
  ROLE_DRIVER: "Driver",
  DRIVER: "Driver",
  ROLE_RIDER: "Rider",
  RIDER: "Rider",
  ROLE_GUARDIAN: "Guardian",
  GUARDIAN: "Guardian",
  ROLE_ORGANIZATION_USER: "Organization User",
  ORGANIZATION_USER: "Organization User",
  ROLE_VIEWER: "Viewer",
  VIEWER: "Viewer",
};

function normalizeRole(role: string) {
  return role.trim().toUpperCase();
}

function getCanonicalRole(role: string) {
  const normalizedRole = normalizeRole(role);

  for (const [canonicalRole, aliases] of Object.entries(canonicalRoleAliases)) {
    if (aliases.includes(normalizedRole)) {
      return canonicalRole;
    }
  }

  return normalizedRole.startsWith("ROLE_")
    ? normalizedRole
    : `ROLE_${normalizedRole}`;
}

function getSessionRoles(session: AuthSession | null) {
  return new Set((session?.identity.roles ?? []).map(getCanonicalRole));
}

function hasTenantWorkspace(session: AuthSession | null) {
  return Boolean(session?.identity.tenantId);
}

export function hasRole(session: AuthSession | null, role: string) {
  return getSessionRoles(session).has(getCanonicalRole(role));
}

export function hasAnyRole(session: AuthSession | null, roles: string[]) {
  return roles.some((role) => hasRole(session, role));
}

export function isPlatformAdmin(session: AuthSession | null) {
  return hasRole(session, "ROLE_PLATFORM_ADMIN");
}

export function isCompanyAdmin(session: AuthSession | null) {
  return hasRole(session, "ROLE_TENANT_ADMIN");
}

export function isDispatcher(session: AuthSession | null) {
  return hasRole(session, "ROLE_DISPATCHER");
}

export function isBillingAdmin(session: AuthSession | null) {
  return hasRole(session, "ROLE_BILLING_ADMIN");
}

export function isComplianceAdmin(session: AuthSession | null) {
  return hasRole(session, "ROLE_COMPLIANCE_ADMIN");
}

export function canAccessCompanyWorkspace(session: AuthSession | null) {
  return (
    hasTenantWorkspace(session) &&
    (isCompanyAdmin(session) ||
      isDispatcher(session) ||
      isBillingAdmin(session) ||
      isComplianceAdmin(session))
  );
}

export function isDriverPortalUser(session: AuthSession | null) {
  return hasTenantWorkspace(session) && hasRole(session, "ROLE_DRIVER") && !isCompanyAdmin(session);
}

export function isRiderPortalUser(session: AuthSession | null) {
  return hasTenantWorkspace(session) && hasRole(session, "ROLE_RIDER");
}

export function isGuardianPortalUser(session: AuthSession | null) {
  return hasTenantWorkspace(session) && hasRole(session, "ROLE_GUARDIAN");
}

export function isOrganizationPortalUser(session: AuthSession | null) {
  return hasTenantWorkspace(session) && hasRole(session, "ROLE_ORGANIZATION_USER");
}

export function getRouteScope(pathname: string): PrivateAppScope | null {
  if (pathname === privateScopeRoots.platform || pathname.startsWith("/platform/")) {
    return "platform";
  }
  if (pathname === privateScopeRoots.company || pathname.startsWith("/company/")) {
    return "company";
  }
  if (pathname === privateScopeRoots.driver || pathname.startsWith("/portal/driver/")) {
    return "driver";
  }
  if (pathname === privateScopeRoots.rider || pathname.startsWith("/portal/rider/")) {
    return "rider";
  }
  if (
    pathname === privateScopeRoots.organization ||
    pathname.startsWith("/portal/organization/")
  ) {
    return "organization";
  }
  return null;
}

export function isPrivateAppPath(pathname: string) {
  return getRouteScope(pathname) !== null;
}

export function canAccessScope(
  session: AuthSession | null,
  scope: PrivateAppScope,
) {
  switch (scope) {
    case "platform":
      return isPlatformAdmin(session);
    case "company":
      return canAccessCompanyWorkspace(session);
    case "driver":
      return isDriverPortalUser(session);
    case "rider":
      return isRiderPortalUser(session) || isGuardianPortalUser(session);
    case "organization":
      return isOrganizationPortalUser(session);
    default:
      return false;
  }
}

export function getDefaultRoute(session: AuthSession | null) {
  if (isPlatformAdmin(session)) {
    return "/platform";
  }
  if (isCompanyAdmin(session)) {
    return "/company";
  }
  if (isDispatcher(session)) {
    return "/company/dispatch";
  }
  if (isBillingAdmin(session)) {
    return "/company/invoices";
  }
  if (isComplianceAdmin(session)) {
    return "/company/compliance";
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

export function resolvePostLoginRoute(
  session: AuthSession | null,
  requestedPath?: string | null,
) {
  if (!requestedPath || publicOnlyRoutes.has(requestedPath)) {
    return getDefaultRoute(session);
  }

  const requestedScope = getRouteScope(requestedPath);
  if (!requestedScope) {
    return getDefaultRoute(session);
  }

  return canAccessScope(session, requestedScope)
    ? requestedPath
    : getDefaultRoute(session);
}

export function resolveAccessFailureRedirect(
  session: AuthSession | null,
  attemptedPath: string,
) {
  const fallbackRoute = getDefaultRoute(session);
  const attemptedScope = getRouteScope(attemptedPath);
  const fallbackScope = getRouteScope(fallbackRoute);

  if (
    fallbackRoute !== "/login" &&
    attemptedScope &&
    fallbackScope &&
    attemptedScope !== fallbackScope
  ) {
    return fallbackRoute;
  }

  return null;
}

export function getRoleLabel(role: string) {
  const canonicalRole = getCanonicalRole(role);
  return (
    roleLabels[canonicalRole] ??
    canonicalRole.replace(/^ROLE_/, "").replaceAll("_", " ")
  );
}