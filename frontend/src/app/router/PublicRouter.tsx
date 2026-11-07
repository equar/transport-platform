import { lazy, type ComponentType } from "react";
import { createBrowserRouter, RouterProvider, redirectDocument } from "react-router-dom";
import { env } from "../../shared/config/env";
import { PublicLayout } from "../layouts/PublicLayout";
function lazyPage<TModule extends Record<string, unknown>>(importer: () => Promise<TModule>, exportName: keyof TModule) {
  return lazy(async () => ({ default: (await importer())[exportName] as ComponentType<any> }));
}
const NotFoundPage = lazyPage(() => import("../../features/public/pages/PublicNotFoundPage"), "PublicNotFoundPage");
const AboutPage = lazyPage(
  () => import("../../features/public/pages/AboutPage"),
  "AboutPage",
);

const ContactPage = lazyPage(
  () => import("../../features/public/pages/ContactPage"),
  "ContactPage",
);

const DataProcessingSupportPage = lazyPage(
  () => import("../../features/public/pages/DataProcessingSupportPage"),
  "DataProcessingSupportPage",
);

const FaqPage = lazyPage(
  () => import("../../features/public/pages/FaqPage"),
  "FaqPage",
);

const FeaturesPage = lazyPage(
  () => import("../../features/public/pages/FeaturesPage"),
  "FeaturesPage",
);

const HomePage = lazyPage(
  () => import("../../features/public/pages/HomePage"),
  "HomePage",
);

const PricingPage = lazyPage(
  () => import("../../features/public/pages/PricingPage"),
  "PricingPage",
);

const PrivacyAndDataHandlingPage = lazyPage(
  () => import("../../features/public/pages/PrivacyAndDataHandlingPage"),
  "PrivacyAndDataHandlingPage",
);

const SecurityOverviewPage = lazyPage(
  () => import("../../features/public/pages/SecurityOverviewPage"),
  "SecurityOverviewPage",
);

const ServiceAgreementsPage = lazyPage(
  () => import("../../features/public/pages/ServiceAgreementsPage"),
  "ServiceAgreementsPage",
);

const SolutionsPage = lazyPage(
  () => import("../../features/public/pages/SolutionsPage"),
  "SolutionsPage",
);

const PublicCompanyApplicationPage = lazyPage(
  () =>
    import("../../features/company-applications/pages/PublicCompanyApplicationPage"),
  "PublicCompanyApplicationPage",
);

const router = createBrowserRouter([
  ...["login", "forgot-password", "reset-password", "unauthorized", "platform/*", "company/*", "portal/*"].map(path => ({
    path: "/" + path,
    loader: ({ request }: { request: Request }) => {
      const url = new URL(request.url);
      return redirectDocument(env.adminSiteUrl + url.pathname + url.search + url.hash);
    },
  })),
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "about",
        element: <AboutPage />,
      },
      {
        path: "solutions",
        element: <SolutionsPage />,
      },
      {
        path: "features",
        element: <FeaturesPage />,
      },
      {
        path: "pricing",
        element: <PricingPage />,
      },
      {
        path: "contact",
        element: <ContactPage />,
      },
      {
        path: "privacy",
        element: <PrivacyAndDataHandlingPage />,
      },
      {
        path: "service-agreements",
        element: <ServiceAgreementsPage />,
      },
      {
        path: "security",
        element: <SecurityOverviewPage />,
      },
      {
        path: "data-processing-support",
        element: <DataProcessingSupportPage />,
      },
      {
        path: "faq",
        element: <FaqPage />,
      },
      {
        path: "/apply",
        element: <PublicCompanyApplicationPage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);
export function PublicRouter() { return <RouterProvider router={router} />; }
