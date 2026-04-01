import { Box, Stack, Typography } from "@mui/material";
import { PublicCtaBand } from "../components/PublicCtaBand";
import { PublicSection } from "../components/PublicSection";
import { PageCard } from "../../../shared/components/PageCard";

const missionVision = [
  {
    title: "Mission",
    description:
      "Help transportation operators run safer, more coordinated, and more accountable services through a platform built around operational realities instead of disconnected systems.",
  },
  {
    title: "Vision",
    description:
      "Create the operating system for multi-tenant transportation programs where platform leaders, company teams, and external stakeholders can work from a shared but properly segmented experience.",
  },
];

const differentiators = [
  {
    title: "Built around operational ownership",
    description:
      "The platform separates platform-level governance from company-level execution so teams can move faster without losing accountability.",
  },
  {
    title: "Designed for portals from the start",
    description:
      "Driver, rider, guardian, and organization-facing experiences are part of the architecture, not an afterthought added later.",
  },
  {
    title: "Commercially SaaS-ready",
    description:
      "Subscription controls and feature management support a credible product strategy as the platform grows across customers and service lines.",
  },
];

export function AboutPage() {
  return (
    <Stack spacing={{ xs: 5, md: 7 }}>
      <PublicSection
        eyebrow="About the platform"
        title="Built for operators that need discipline, not another disconnected toolchain."
        description="Transport Platform exists to help transportation teams run a modern, governed service operation across onboarding, dispatch, billing, portals, and long-term tenant growth."
      >
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
          }}
        >
          {missionVision.map((item) => (
            <PageCard key={item.title} sx={{ height: "100%" }}>
              <Stack spacing={1.5}>
                <Typography variant="h4">{item.title}</Typography>
                <Typography color="text.secondary">
                  {item.description}
                </Typography>
              </Stack>
            </PageCard>
          ))}
        </Box>
      </PublicSection>

      <PublicSection
        eyebrow="Problem"
        title="Transportation programs outgrow spreadsheets, siloed tools, and generic workflow software quickly."
        description="Most operations teams are forced to bridge onboarding, scheduling, driver coordination, billing, compliance, and communications across systems that were never designed to work as one operating model."
      >
        <PageCard>
          <Typography color="text.secondary">
            The platform is designed to solve that fragmentation. Instead of
            asking teams to assemble a patchwork of admin portals, dispatch
            tools, finance systems, and stakeholder touchpoints, it creates a
            single SaaS platform where each role sees the right surface and
            leadership keeps the right level of control.
          </Typography>
        </PageCard>
      </PublicSection>

      <PublicSection
        eyebrow="How we differ"
        title="The difference is not just features. It is the operating model behind them."
        description="Most transportation software is built around individual modules. We built the platform around the operating model first, so every module connects the way your team actually works."
      >
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
          }}
        >
          {differentiators.map((item) => (
            <PageCard key={item.title} sx={{ height: "100%" }}>
              <Stack spacing={1.5}>
                <Typography variant="h5">{item.title}</Typography>
                <Typography color="text.secondary">
                  {item.description}
                </Typography>
              </Stack>
            </PageCard>
          ))}
        </Box>
      </PublicSection>

      <PublicCtaBand
        eyebrow="Next step"
        title="Understand the platform story, then move into a demo or pricing conversation."
        description="Ready to see how the platform works in practice? Schedule a demo or start your application."
        primaryLabel="Request Demo"
        primaryTo="/contact#request-demo"
        secondaryLabel="See Pricing"
        secondaryTo="/pricing"
      />
    </Stack>
  );
}
