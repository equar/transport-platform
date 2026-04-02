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
  "Built-in access controls for every team",
  "Dedicated portals for drivers, riders, and organizations",
  "Dispatch, billing, and onboarding in one platform",
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
      { label: "Sign in", to: "/login" },
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
      { label: "Privacy and Data Handling", to: "/privacy" },
      { label: "Service Agreements", to: "/service-agreements" },
      { label: "Security Overview", to: "/security" },
      { label: "Data Processing Support", to: "/data-processing-support" },
    ],
  },
];
