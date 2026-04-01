import { Box, Stack, Typography } from "@mui/material";
import { PublicCtaBand } from "../components/PublicCtaBand";
import { PublicSection } from "../components/PublicSection";
import { PageCard } from "../../../shared/components/PageCard";

const featureModules = [
  "Users and roles",
  "Drivers",
  "Vehicles",
  "Riders and guardians",
  "Organizations and contracts",
  "Ride scheduling",
  "Recurring rides",
  "Dispatch board",
  "Routes",
  "Invoices and payments",
  "Notifications",
  "Compliance",
  "Incidents",
  "Reports",
  "Portals",
  "SaaS features",
];

export function FeaturesPage() {
  return (
    <Stack spacing={{ xs: 5, md: 7 }}>
      <PublicSection
        eyebrow="Feature architecture"
        title="Explain the product through the modules visitors will eventually buy, deploy, and use."
        description="The public feature page now maps directly to the major product areas in the application, making the platform feel concrete before a prospect signs in."
      >
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" },
          }}
        >
          {featureModules.map((module) => (
            <PageCard key={module} sx={{ height: "100%" }}>
              <Stack spacing={1}>
                <Typography variant="h6">{module}</Typography>
                <Typography color="text.secondary">
                  Structured to fit a multi-tenant transportation operating
                  model.
                </Typography>
              </Stack>
            </PageCard>
          ))}
        </Box>
      </PublicSection>

      <PublicSection
        eyebrow="Why it matters"
        title="Visitors should be able to understand the breadth of the platform without reading internal product docs."
        description="This page now gives prospects and implementation stakeholders a clear inventory of the major modules already shaping the private product."
      >
        <PageCard>
          <Typography color="text.secondary">
            Instead of burying the product behind login, the public shell now
            explains how the platform supports onboarding, operations,
            dispatching, finance, safety, communications, portals, and SaaS
            administration in one coherent system.
          </Typography>
        </PageCard>
      </PublicSection>

      <PublicCtaBand
        eyebrow="See the full story"
        title="Use the feature overview to move naturally into pricing or a guided demo."
        description="Visitors now have enough context to understand what the product covers before entering a sales or onboarding path."
        primaryLabel="Request Demo"
        primaryTo="/contact#request-demo"
        secondaryLabel="Review pricing"
        secondaryTo="/pricing"
      />
    </Stack>
  );
}
