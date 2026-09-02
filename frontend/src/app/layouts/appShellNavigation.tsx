import type { ReactNode } from "react";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import AutoAwesomeMotionRoundedIcon from "@mui/icons-material/AutoAwesomeMotionRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ContactPhoneRoundedIcon from "@mui/icons-material/ContactPhoneRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import DirectionsCarFilledRoundedIcon from "@mui/icons-material/DirectionsCarFilledRounded";
import DriveEtaRoundedIcon from "@mui/icons-material/DriveEtaRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import RouteRoundedIcon from "@mui/icons-material/RouteRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import AccessibleRoundedIcon from "@mui/icons-material/AccessibleRounded";
import RepeatRoundedIcon from "@mui/icons-material/RepeatRounded";
import type { AuthSession } from "../../features/auth/types";
import type { RuntimeModuleAccess } from "../../features/runtime/api/runtimeApi";
import {
  canAccessCompanyWorkspace,
  getDefaultRoute,
  hasRole,
  isCompanyAdmin,
  isDriverPortalUser,
  isGuardianPortalUser,
  isOrganizationPortalUser,
  isPlatformAdmin,
  isRiderPortalUser,
} from "../../features/auth/access";

type AppShellScope =
  | "platform"
  | "company"
  | "driver"
  | "rider"
  | "organization";
type CompanyAudience =
  | "company-admin"
  | "dispatcher"
  | "billing-admin"
  | "compliance-admin";

export interface AppShellNavItem {
  label: string;
  description: string;
  to: string;
  icon: ReactNode;
  requiredModule?: keyof RuntimeModuleAccess;
  audiences?: CompanyAudience[];
}

export interface AppShellNavSection {
  title: string;
  items: AppShellNavItem[];
}

export interface AppShellView {
  scope: AppShellScope;
  scopeLabel: string;
  title: string;
  description: string;
  sections: AppShellNavSection[];
}

const platformSections: AppShellNavSection[] = [
  {
    title: "Platform",
    items: [
      {
        label: "Dashboard",
        description: "Portfolio health, onboarding, and company activity.",
        to: "/platform",
        icon: <DashboardRoundedIcon fontSize="small" />,
      },
      {
        label: "Tenants",
        description: "Provisioned customer organizations and workspace state.",
        to: "/platform/tenants",
        icon: <ApartmentRoundedIcon fontSize="small" />,
      },
      {
        label: "Company Applications",
        description: "Public intake queue and onboarding review workflow.",
        to: "/platform/company-applications",
        icon: <AssignmentTurnedInRoundedIcon fontSize="small" />,
      },
      {
        label: "Users",
        description: "Cross-tenant user administration and account posture.",
        to: "/platform/users",
        icon: <BadgeRoundedIcon fontSize="small" />,
      },
      {
        label: "Roles",
        description: "Governed access model and assignment visibility.",
        to: "/platform/roles",
        icon: <SecurityRoundedIcon fontSize="small" />,
      },
    ],
  },
  {
    title: "SaaS administration",
    items: [
      {
        label: "Subscription Plans",
        description: "Commercial packaging, limits, and entitlement bundles.",
        to: "/platform/subscription-plans",
        icon: <AttachMoneyRoundedIcon fontSize="small" />,
      },
      {
        label: "Tenant Subscriptions",
        description: "Assignments, trials, renewals, and lifecycle controls.",
        to: "/platform/tenant-subscriptions",
        icon: <ReceiptLongRoundedIcon fontSize="small" />,
      },
      {
        label: "Feature Flags",
        description: "Rollouts, entitlements, and tenant-specific overrides.",
        to: "/platform/feature-flags",
        icon: <AutoAwesomeMotionRoundedIcon fontSize="small" />,
      },
      {
        label: "Audit Logs",
        description: "Platform-wide administrative activity and review trail.",
        to: "/platform/audit-logs",
        icon: <HistoryRoundedIcon fontSize="small" />,
      },
    ],
  },
];

const companySections: AppShellNavSection[] = [
  {
    title: "Overview",
    items: [
      {
        label: "Dashboard",
        description: "Company-level operational posture and admin coverage.",
        to: "/company",
        icon: <DashboardRoundedIcon fontSize="small" />,
        audiences: [
          "company-admin",
          "dispatcher",
          "billing-admin",
          "compliance-admin",
        ],
      },
      {
        label: "Notifications",
        description:
          "Operational, billing, and workflow alerts for the current user.",
        to: "/company/notifications",
        icon: <NotificationsRoundedIcon fontSize="small" />,
        requiredModule: "notifications",
        audiences: [
          "company-admin",
          "dispatcher",
          "billing-admin",
          "compliance-admin",
        ],
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        label: "Riders",
        description:
          "Rider onboarding, support needs, and active service records.",
        to: "/company/riders",
        icon: <AccessibleRoundedIcon fontSize="small" />,
        audiences: ["company-admin", "dispatcher"],
      },
      {
        label: "Guardians",
        description:
          "Family contacts, pickup authorization, and billing visibility.",
        to: "/company/guardians",
        icon: <ContactPhoneRoundedIcon fontSize="small" />,
        audiences: ["company-admin", "dispatcher"],
      },
      {
        label: "Drivers",
        description: "Driver onboarding, readiness, and assignment posture.",
        to: "/company/drivers",
        icon: <DriveEtaRoundedIcon fontSize="small" />,
        audiences: ["company-admin", "dispatcher", "compliance-admin"],
      },
      {
        label: "Vehicles",
        description:
          "Fleet readiness, lifecycle control, and compliance status.",
        to: "/company/vehicles",
        icon: <DirectionsCarFilledRoundedIcon fontSize="small" />,
        audiences: ["company-admin", "dispatcher", "compliance-admin"],
      },
      {
        label: "Rides",
        description:
          "One-off ride intake, lifecycle control, and scheduling readiness.",
        to: "/company/rides",
        icon: <CalendarMonthRoundedIcon fontSize="small" />,
        requiredModule: "dispatch",
        audiences: ["company-admin", "dispatcher"],
      },
      {
        label: "Recurring Rides",
        description:
          "Recurring service templates and controlled ride generation.",
        to: "/company/recurring-rides",
        icon: <RepeatRoundedIcon fontSize="small" />,
        requiredModule: "recurringRides",
        audiences: ["company-admin", "dispatcher"],
      },
      {
        label: "Dispatch",
        description:
          "Assignment coverage, exception handling, and day-of-service control.",
        to: "/company/dispatch",
        icon: <DirectionsCarFilledRoundedIcon fontSize="small" />,
        requiredModule: "dispatch",
        audiences: ["company-admin", "dispatcher"],
      },
      {
        label: "Routes",
        description: "Route manifests, sequencing, and operational readiness.",
        to: "/company/routes",
        icon: <RouteRoundedIcon fontSize="small" />,
        requiredModule: "routes",
        audiences: ["company-admin", "dispatcher"],
      },
    ],
  },
  {
    title: "Finance",
    items: [
      {
        label: "Pricing Rules",
        description:
          "Rate policies, bill-to models, and service pricing controls.",
        to: "/company/pricing-rules",
        icon: <AttachMoneyRoundedIcon fontSize="small" />,
        requiredModule: "billing",
        audiences: ["company-admin", "billing-admin"],
      },
      {
        label: "Invoices",
        description: "Drafts, issuance, balances, and billing workflow status.",
        to: "/company/invoices",
        icon: <ReceiptLongRoundedIcon fontSize="small" />,
        requiredModule: "billing",
        audiences: ["company-admin", "billing-admin"],
      },
      {
        label: "Payments",
        description: "Manual payment recording, application, and tracing.",
        to: "/company/payments",
        icon: <PaymentsRoundedIcon fontSize="small" />,
        requiredModule: "billing",
        audiences: ["company-admin", "billing-admin"],
      },
      {
        label: "Receivables",
        description: "Aging exposure, overdue balances, and follow-up posture.",
        to: "/company/receivables",
        icon: <AttachMoneyRoundedIcon fontSize="small" />,
        requiredModule: "billing",
        audiences: ["company-admin", "billing-admin"],
      },
    ],
  },
  {
    title: "Governance",
    items: [
      {
        label: "Users",
        description: "Manage company administrators and operational users.",
        to: "/company/users",
        icon: <BadgeRoundedIcon fontSize="small" />,
        audiences: ["company-admin"],
      },
      {
        label: "Roles",
        description: "Tenant-safe role definitions and usage visibility.",
        to: "/company/roles",
        icon: <SecurityRoundedIcon fontSize="small" />,
        audiences: ["company-admin"],
      },
      {
        label: "Notification Templates",
        description: "Tenant-managed rendering for in-app and email hooks.",
        to: "/company/notification-templates",
        icon: <AutoAwesomeMotionRoundedIcon fontSize="small" />,
        requiredModule: "notifications",
        audiences: ["company-admin"],
      },
      {
        label: "Compliance",
        description:
          "Issue tracking for expiring, missing, and rejected documents.",
        to: "/company/compliance",
        icon: <FactCheckRoundedIcon fontSize="small" />,
        requiredModule: "compliance",
        audiences: ["company-admin", "compliance-admin"],
      },
      {
        label: "Transport Compliance",
        description: "Operator authority, insurance, safeguarding, privacy, and accessibility attestation.",
        to: "/company/transport-compliance",
        icon: <FactCheckRoundedIcon fontSize="small" />,
        requiredModule: "compliance",
        audiences: ["company-admin"],
      },
      {
        label: "Incidents",
        description: "Complaint, safety, and operational issue workflow.",
        to: "/company/incidents",
        icon: <ReportProblemRoundedIcon fontSize="small" />,
        requiredModule: "incidents",
        audiences: ["company-admin", "compliance-admin"],
      },
      {
        label: "Reports",
        description:
          "Operational, billing, compliance, and incident reporting.",
        to: "/company/reports",
        icon: <AssessmentRoundedIcon fontSize="small" />,
        requiredModule: "reports",
        audiences: ["company-admin", "billing-admin", "compliance-admin"],
      },
      {
        label: "Settings",
        description:
          "Tenant profile, defaults, policies, and branding controls.",
        to: "/company/settings",
        icon: <SettingsRoundedIcon fontSize="small" />,
        audiences: ["company-admin"],
      },
      {
        label: "Audit Logs",
        description:
          "Tenant administrative activity and governance review trail.",
        to: "/company/audit-logs",
        icon: <HistoryRoundedIcon fontSize="small" />,
        audiences: ["company-admin"],
      },
    ],
  },
];

const driverSections: AppShellNavSection[] = [
  {
    title: "Driver Portal",
    items: [
      {
        label: "Dashboard",
        description: "Today’s rides, route readiness, and personal alerts.",
        to: "/portal/driver",
        icon: <DashboardRoundedIcon fontSize="small" />,
      },
      {
        label: "Profile",
        description: "Self-service contact, address, and emergency details.",
        to: "/portal/driver/profile",
        icon: <BadgeRoundedIcon fontSize="small" />,
      },
      {
        label: "Compliance",
        description: "Document status, expirations, and compliance issues.",
        to: "/portal/driver/compliance",
        icon: <FactCheckRoundedIcon fontSize="small" />,
      },
      {
        label: "Rides",
        description: "Assigned trip queue, ride detail, and status updates.",
        to: "/portal/driver/rides",
        icon: <CalendarMonthRoundedIcon fontSize="small" />,
      },
      {
        label: "Routes",
        description: "Daily manifests, stops, and route context.",
        to: "/portal/driver/routes",
        icon: <RouteRoundedIcon fontSize="small" />,
      },
      {
        label: "Notifications",
        description: "Operational alerts and account messages.",
        to: "/portal/driver/notifications",
        icon: <NotificationsRoundedIcon fontSize="small" />,
      },
    ],
  },
];

const riderSections: AppShellNavSection[] = [
  {
    title: "Rider And Guardian Portal",
    items: [
      {
        label: "Dashboard",
        description: "Account overview, linked riders, and ride snapshot.",
        to: "/portal/rider",
        icon: <DashboardRoundedIcon fontSize="small" />,
      },
      {
        label: "Profile",
        description: "Contact details, addresses, and preferences.",
        to: "/portal/rider/profile",
        icon: <BadgeRoundedIcon fontSize="small" />,
      },
      {
        label: "Rides",
        description: "Visible trips, ride timing, and service status.",
        to: "/portal/rider/rides",
        icon: <CalendarMonthRoundedIcon fontSize="small" />,
      },
      {
        label: "Billing",
        description: "Invoices, balances, and payment history.",
        to: "/portal/rider/billing",
        icon: <AttachMoneyRoundedIcon fontSize="small" />,
      },
      {
        label: "Notifications",
        description: "Portal alerts and communication updates.",
        to: "/portal/rider/notifications",
        icon: <NotificationsRoundedIcon fontSize="small" />,
      },
    ],
  },
];

const organizationSections: AppShellNavSection[] = [
  {
    title: "Organization Portal",
    items: [
      {
        label: "Dashboard",
        description:
          "Organization overview, service snapshot, and billing summary.",
        to: "/portal/organization",
        icon: <DashboardRoundedIcon fontSize="small" />,
      },
      {
        label: "Profile",
        description: "Current organization contact details.",
        to: "/portal/organization/profile",
        icon: <BadgeRoundedIcon fontSize="small" />,
      },
      {
        label: "Roster",
        description: "Organization contacts and linked riders.",
        to: "/portal/organization/roster",
        icon: <ContactPhoneRoundedIcon fontSize="small" />,
      },
      {
        label: "Contracts",
        description: "Agreements and visible ride activity.",
        to: "/portal/organization/contracts",
        icon: <ReceiptLongRoundedIcon fontSize="small" />,
      },
      {
        label: "Billing",
        description: "Invoices, balances, and payment history.",
        to: "/portal/organization/billing",
        icon: <AttachMoneyRoundedIcon fontSize="small" />,
      },
      {
        label: "Notifications",
        description: "Portal alerts and account updates.",
        to: "/portal/organization/notifications",
        icon: <NotificationsRoundedIcon fontSize="small" />,
      },
    ],
  },
];

function hasCompanyAudience(
  audiences: CompanyAudience[] | undefined,
  session: AuthSession | null,
) {
  if (!audiences || audiences.length === 0) {
    return false;
  }

  if (isCompanyAdmin(session)) {
    return true;
  }

  return audiences.some((audience) => {
    switch (audience) {
      case "dispatcher":
        return hasRole(session, "ROLE_DISPATCHER");
      case "billing-admin":
        return hasRole(session, "ROLE_BILLING_ADMIN");
      case "compliance-admin":
        return hasRole(session, "ROLE_COMPLIANCE_ADMIN");
      case "company-admin":
        return isCompanyAdmin(session);
      default:
        return false;
    }
  });
}

function filterCompanySections(
  sections: AppShellNavSection[],
  session: AuthSession | null,
  moduleAccess: RuntimeModuleAccess | null,
) {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        const moduleEnabled = item.requiredModule
          ? moduleAccess === null || moduleAccess[item.requiredModule] === true
          : true;
        return moduleEnabled && hasCompanyAudience(item.audiences, session);
      }),
    }))
    .filter((section) => section.items.length > 0);
}

function flattenSections(sections: AppShellNavSection[]) {
  return sections.flatMap((section) => section.items);
}

function isRootDashboardPath(pathname: string) {
  return (
    pathname === "/platform" ||
    pathname === "/company" ||
    pathname === "/portal/driver" ||
    pathname === "/portal/rider" ||
    pathname === "/portal/organization"
  );
}

function doesNavItemMatchPath(item: AppShellNavItem, pathname: string) {
  if (isRootDashboardPath(item.to)) {
    return pathname === item.to;
  }

  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

export function findAppShellNavItemForPath(
  pathname: string,
  sections: AppShellNavSection[],
) {
  return (
    [...flattenSections(sections)]
      .sort((left, right) => right.to.length - left.to.length)
      .find((item) => doesNavItemMatchPath(item, pathname)) ?? null
  );
}

export function canAccessShellPath(
  session: AuthSession | null,
  moduleAccess: RuntimeModuleAccess | null,
  pathname: string,
) {
  const shellView = buildAppShellView(session, moduleAccess);
  const profilePath = getAppShellProfilePath(session, moduleAccess);

  return (
    findAppShellNavItemForPath(pathname, shellView.sections) !== null ||
    (profilePath !== null && doesNavItemMatchPath({ to: profilePath } as AppShellNavItem, pathname))
  );
}

export function getAppShellHomePath(
  session: AuthSession | null,
  moduleAccess: RuntimeModuleAccess | null,
) {
  const shellView = buildAppShellView(session, moduleAccess);
  return flattenSections(shellView.sections)[0]?.to ?? getDefaultRoute(session);
}

export function getAppShellProfilePath(
  session: AuthSession | null,
  moduleAccess: RuntimeModuleAccess | null,
) {
  if (isPlatformAdmin(session)) {
    return "/platform/profile";
  }

  if (canAccessCompanyWorkspace(session)) {
    return "/company/security";
  }

  const shellView = buildAppShellView(session, moduleAccess);
  const items = flattenSections(shellView.sections);

  return (
    items.find((item) => item.label === "Profile")?.to ??
    items.find((item) => item.to === "/company/settings")?.to ??
    null
  );
}

export function buildAppShellView(
  session: AuthSession | null,
  moduleAccess: RuntimeModuleAccess | null,
): AppShellView {
  if (isPlatformAdmin(session)) {
    return {
      scope: "platform",
      scopeLabel: "Platform",
      title: "Operations control plane",
      description:
        "Tenant onboarding, SaaS administration, identity governance, and audit visibility across the platform.",
      sections: platformSections,
    };
  }

  if (isDriverPortalUser(session)) {
    return {
      scope: "driver",
      scopeLabel: "Driver Portal",
      title: "Driver workspace",
      description:
        "Assigned rides, route readiness, compliance visibility, and notifications in one focused portal shell.",
      sections: driverSections,
    };
  }

  if (isRiderPortalUser(session) || isGuardianPortalUser(session)) {
    return {
      scope: "rider",
      scopeLabel: "Rider Portal",
      title: "Rider and guardian workspace",
      description:
        "Ride visibility, billing, and communication updates in a focused self-service portal.",
      sections: riderSections,
    };
  }

  if (isOrganizationPortalUser(session)) {
    return {
      scope: "organization",
      scopeLabel: "Organization Portal",
      title: "Organization workspace",
      description:
        "Roster, contract, billing, and communication visibility for organization contacts.",
      sections: organizationSections,
    };
  }

  const dispatcher = hasRole(session, "ROLE_DISPATCHER");
  const billingAdmin = hasRole(session, "ROLE_BILLING_ADMIN");
  const complianceAdmin = hasRole(session, "ROLE_COMPLIANCE_ADMIN");

  return {
    scope: "company",
    scopeLabel: "Company",
    title: isCompanyAdmin(session)
      ? "Company operations workspace"
      : dispatcher
        ? "Dispatch workspace"
        : billingAdmin
          ? "Billing workspace"
          : complianceAdmin
            ? "Compliance workspace"
            : "Company workspace",
    description: isCompanyAdmin(session)
      ? "Operational oversight across users, dispatch, billing, compliance, reporting, and tenant configuration."
      : dispatcher
        ? "Scheduling, rides, dispatch, route execution, and operational coordination for company teams."
        : billingAdmin
          ? "Pricing, invoices, payments, receivables, and financial reporting for the current tenant."
          : complianceAdmin
            ? "Driver, vehicle, compliance, incident, and governance visibility for the current tenant."
            : "Tenant-scoped workspace for company operations.",
    sections: filterCompanySections(companySections, session, moduleAccess),
  };
}
