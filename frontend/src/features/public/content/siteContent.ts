export interface PublicNavigationItem {
  label: string;
  to: string;
}

export interface PublicFooterSection {
  title: string;
  links: Array<{
    label: string;
    to?: string;
    placeholder?: boolean;
  }>;
}

export const publicPrimaryCta = {
  label: "Request Demo",
  to: "/contact#request-demo",
};

export const publicSecondaryCta = {
  label: "Apply to Join",
  to: "/apply",
};

export const publicAuthCta = {
  label: "Sign in",
  to: "/login",
};

export const publicTrustHighlights = [
  "Tenant-safe access controls",
  "Role-aware portal experiences",
  "Dispatch, billing, and onboarding foundations",
];

export const publicNavigationItems: PublicNavigationItem[] = [
  { label: "Home", to: "/" },
  { label: "Solutions", to: "/solutions" },
  { label: "Features", to: "/features" },
  { label: "Pricing", to: "/pricing" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
  { label: "FAQ", to: "/faq" },
];

export const publicFooterSections: PublicFooterSection[] = [
  {
    title: "Product",
    links: [
      { label: "Solutions", to: "/solutions" },
      { label: "Features", to: "/features" },
      { label: "Pricing", to: "/pricing" },
      { label: "Apply to Join", to: "/apply" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", to: "/about" },
      { label: "Contact", to: "/contact" },
      { label: "Request Demo", to: "/contact#request-demo" },
      { label: "Login", to: "/login" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "FAQ", to: "/faq" },
      { label: "Forgot Password", to: "/forgot-password" },
      { label: "Reset Password", to: "/reset-password" },
      { label: "Workspace Help", to: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", placeholder: true },
      { label: "Terms of Service", placeholder: true },
      { label: "Security", placeholder: true },
      { label: "Data Processing", placeholder: true },
    ],
  },
];
