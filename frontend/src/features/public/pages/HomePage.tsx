import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import Diversity3RoundedIcon from "@mui/icons-material/Diversity3Rounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import LayersRoundedIcon from "@mui/icons-material/LayersRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import RouteRoundedIcon from "@mui/icons-material/RouteRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { PublicCtaBand } from "../components/PublicCtaBand";
import { PublicSection } from "../components/PublicSection";
import {
  publicAuthCta,
  publicPrimaryCta,
  publicSecondaryCta,
  publicTrustHighlights,
} from "../content/siteContent";
import { PageCard } from "../../../shared/components/PageCard";

const strategicPillars = [
  {
    title: "Tenant-governed operations",
    description:
      "Separate platform oversight from company execution without fragmenting the user experience.",
    icon: <ShieldRoundedIcon color="primary" />,
  },
  {
    title: "Portal-ready architecture",
    description:
      "Support drivers, riders, guardians, and organization users from one connected product experience.",
    icon: <HubRoundedIcon color="primary" />,
  },
  {
    title: "Operational observability",
    description:
      "Prepare dispatch, compliance, billing, and reporting workflows inside one coherent shell.",
    icon: <TimelineRoundedIcon color="primary" />,
  },
];

const launchReadiness = [
  "Public website routes separated cleanly from authenticated product routes",
  "Responsive navigation, footer structure, and consistent CTA placement",
  "Production-grade Material UI layout patterns aligned with the existing app theme",
];

const audienceSegments = [
  {
    title: "Transportation operators",
    description:
      "For teams running daily service, vehicle readiness, rider coordination, and company-level execution across multiple workflows.",
  },
  {
    title: "Care and mobility programs",
    description:
      "For organizations supporting elderly transportation, NEMT, and contract-based service models that need traceability and operational discipline.",
  },
  {
    title: "Network stakeholders",
    description:
      "For platform admins, organization users, riders, guardians, and drivers who each need a clean, role-appropriate entry point.",
  },
];

const capabilities = [
  {
    title: "Tenant-aware platform controls",
    description:
      "Manage onboarding, user access, and SaaS posture without mixing platform governance into daily company workflows.",
    icon: <LayersRoundedIcon color="primary" />,
  },
  {
    title: "Scheduling, dispatch, and route execution",
    description:
      "Coordinate one-time and recurring rides with the visibility required for day-of-service operations.",
    icon: <RouteRoundedIcon color="primary" />,
  },
  {
    title: "Billing and accountability",
    description:
      "Move from rides delivered to invoices, payments, receivables, and reporting inside one connected workspace.",
    icon: <ReceiptLongRoundedIcon color="primary" />,
  },
];

const workflowSteps = [
  {
    step: "01",
    title: "Establish the organization",
    description:
      "Bring workspace setup, branding, onboarding, and access controls under one governed SaaS platform.",
  },
  {
    step: "02",
    title: "Operationalize service delivery",
    description:
      "Manage riders, drivers, vehicles, schedules, dispatching, and route execution in one operational model.",
  },
  {
    step: "03",
    title: "Extend to portals and reporting",
    description:
      "Expose the right information to external roles while maintaining visibility across notifications, billing, compliance, and analytics.",
  },
];

const differentiators = [
  "Multi-tenant design aligned with platform and company ownership boundaries",
  "Role-aware experiences for internal teams and external portal users",
  "Operational architecture that can scale from onboarding into daily execution",
  "Subscription controls and feature management that support long-term growth",
];

const portalRoles = [
  {
    title: "Platform and company admins",
    description:
      "Oversee onboarding, access, operational controls, and tenant-level delivery from the right workspace.",
    icon: <ShieldRoundedIcon color="secondary" />,
  },
  {
    title: "Drivers and field teams",
    description:
      "Access assignments, routes, compliance tasks, and notifications from a focused operational portal.",
    icon: <TimelineRoundedIcon color="secondary" />,
  },
  {
    title: "Riders, guardians, and organizations",
    description:
      "Give external stakeholders visibility into rides, rosters, billing, and communication without exposing internal operations.",
    icon: <Diversity3RoundedIcon color="secondary" />,
  },
];

export function HomePage() {
  return (
    <Stack spacing={{ xs: 5, md: 7 }}>
      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: {
            xs: "1fr",
            md: "minmax(0, 1.35fr) minmax(320px, 0.95fr)",
          },
          alignItems: "stretch",
        }}
      >
        <Stack spacing={3} justifyContent="center">
          <Chip
            label="Public SaaS shell"
            color="secondary"
            sx={{ alignSelf: "flex-start", fontWeight: 700 }}
          />
          <Stack spacing={2}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: "2.9rem", md: "5.2rem" },
                lineHeight: 0.95,
                maxWidth: 860,
              }}
            >
              Transportation operations software with a public front door that
              finally matches the product ambition.
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ maxWidth: 760, fontWeight: 400 }}
            >
              Bring onboarding, tenant governance, dispatch readiness, billing,
              and portal access into one polished transportation SaaS experience
              that buyers, operators, and external users can all trust.
            </Typography>
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button
              component={RouterLink}
              to={publicPrimaryCta.to}
              variant="contained"
              size="large"
            >
              {publicPrimaryCta.label}
            </Button>
            <Button
              component={RouterLink}
              to={publicSecondaryCta.to}
              variant="outlined"
              size="large"
              endIcon={<ArrowOutwardRoundedIcon />}
            >
              {publicSecondaryCta.label}
            </Button>
            <Button
              component={RouterLink}
              to={publicAuthCta.to}
              variant="text"
              size="large"
            >
              {publicAuthCta.label}
            </Button>
          </Stack>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            useFlexGap
            flexWrap="wrap"
          >
            {publicTrustHighlights.map((item) => (
              <Chip
                key={item}
                label={item}
                variant="outlined"
                sx={{
                  alignSelf: "flex-start",
                  bgcolor: "rgba(255,255,255,0.6)",
                }}
              />
            ))}
          </Stack>
        </Stack>

        <PageCard
          sx={{
            background:
              "linear-gradient(180deg, rgba(15, 76, 92, 0.08) 0%, rgba(255, 255, 255, 0.95) 100%)",
          }}
        >
          <Stack spacing={3}>
            <Box>
              <Typography variant="overline" color="secondary.main">
                Trust at launch
              </Typography>
              <Typography variant="h4" sx={{ mt: 1 }}>
                The website and application now speak the same product language.
              </Typography>
            </Box>
            <Stack spacing={1.5}>
              {launchReadiness.map((item) => (
                <Stack
                  key={item}
                  direction="row"
                  spacing={1.25}
                  alignItems="flex-start"
                >
                  <CheckCircleOutlineRoundedIcon
                    color="secondary"
                    sx={{ mt: 0.25 }}
                  />
                  <Typography color="text.secondary">{item}</Typography>
                </Stack>
              ))}
            </Stack>
          </Stack>
        </PageCard>
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
        }}
      >
        {strategicPillars.map((pillar) => (
          <PageCard key={pillar.title} sx={{ height: "100%" }}>
            <Stack spacing={2}>
              <Box>{pillar.icon}</Box>
              <Typography variant="h5">{pillar.title}</Typography>
              <Typography color="text.secondary">
                {pillar.description}
              </Typography>
            </Stack>
          </PageCard>
        ))}
      </Box>

      <PublicSection
        eyebrow="Who we serve"
        title="Designed for transportation programs that need structure across people, service, and accountability."
        description="The public site now explains the product in terms decision-makers understand: operational complexity, stakeholder coordination, and the need for a governed system instead of scattered tools."
      >
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
          }}
        >
          {audienceSegments.map((segment) => (
            <PageCard key={segment.title} sx={{ height: "100%" }}>
              <Stack spacing={1.5}>
                <Typography variant="h5">{segment.title}</Typography>
                <Typography color="text.secondary">
                  {segment.description}
                </Typography>
              </Stack>
            </PageCard>
          ))}
        </Box>
      </PublicSection>

      <PublicSection
        eyebrow="Key capabilities"
        title="One platform surface for the operational modules transportation teams actually need to connect."
        description="Instead of presenting isolated features, the home page now frames the platform around the core capabilities that drive execution and growth."
      >
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
          }}
        >
          {capabilities.map((capability) => (
            <PageCard key={capability.title} sx={{ height: "100%" }}>
              <Stack spacing={2}>
                <Box>{capability.icon}</Box>
                <Typography variant="h5">{capability.title}</Typography>
                <Typography color="text.secondary">
                  {capability.description}
                </Typography>
              </Stack>
            </PageCard>
          ))}
        </Box>
      </PublicSection>

      <PublicSection
        eyebrow="How it works"
        title="Move from onboarding to execution in a sequence that makes sense operationally."
        description="The product story now maps to a real implementation journey, giving visitors a clearer sense of how the platform grows with them."
      >
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
          }}
        >
          {workflowSteps.map((step) => (
            <PageCard key={step.step} sx={{ height: "100%" }}>
              <Stack spacing={1.5}>
                <Typography variant="overline" color="secondary.main">
                  Step {step.step}
                </Typography>
                <Typography variant="h5">{step.title}</Typography>
                <Typography color="text.secondary">
                  {step.description}
                </Typography>
              </Stack>
            </PageCard>
          ))}
        </Box>
      </PublicSection>

      <PublicSection
        eyebrow="Why choose us"
        title="Built to support serious transportation operations, not just a marketing promise."
        description="The website should make clear why the platform is different: it is designed around governance, execution, and long-term extensibility."
      >
        <PageCard>
          <Box
            sx={{
              display: "grid",
              gap: 3,
              gridTemplateColumns: {
                xs: "1fr",
                md: "minmax(0, 1.1fr) minmax(0, 0.9fr)",
              },
              alignItems: "center",
            }}
          >
            <Stack spacing={1.5}>
              {differentiators.map((item) => (
                <Stack
                  key={item}
                  direction="row"
                  spacing={1.25}
                  alignItems="flex-start"
                >
                  <CheckCircleOutlineRoundedIcon
                    color="secondary"
                    sx={{ mt: 0.25 }}
                  />
                  <Typography color="text.secondary">{item}</Typography>
                </Stack>
              ))}
            </Stack>
            <Stack spacing={1.5}>
              <Button
                component={RouterLink}
                to="/features"
                variant="contained"
                size="large"
              >
                Explore platform features
              </Button>
              <Button
                component={RouterLink}
                to="/about"
                variant="outlined"
                size="large"
              >
                Learn how we are different
              </Button>
            </Stack>
          </Box>
        </PageCard>
      </PublicSection>

      <PublicSection
        eyebrow="Role and portal overview"
        title="Give every role a clear path without forcing everyone into the same interface."
        description="The public story now reflects the role-specific access model already established in the application architecture."
      >
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
          }}
        >
          {portalRoles.map((role) => (
            <PageCard key={role.title} sx={{ height: "100%" }}>
              <Stack spacing={2}>
                <Box>{role.icon}</Box>
                <Typography variant="h5">{role.title}</Typography>
                <Typography color="text.secondary">
                  {role.description}
                </Typography>
              </Stack>
            </PageCard>
          ))}
        </Box>
      </PublicSection>

      <PublicCtaBand
        eyebrow="Ready to evaluate"
        title="See the platform in context before your team signs in."
        description="Use the public site to understand the operating model, then move directly into a demo, application, or product conversation."
        primaryLabel="Request Demo"
        primaryTo="/contact#request-demo"
        secondaryLabel="Apply to Join"
        secondaryTo="/apply"
      />
    </Stack>
  );
}
