import { Box, Stack, Typography } from "@mui/material";
import { PlatformImage } from "../components/PlatformImage";
import { PublicCtaBand } from "../components/PublicCtaBand";
import { PublicSection } from "../components/PublicSection";
import { PageCard } from "../../../shared/components/PageCard";

const featureModules = [
  {
    name: "Users and roles",
    description:
      "Manage platform and company users with role-based access control and workspace-aware permissions.",
  },
  {
    name: "Drivers",
    description:
      "Onboard, track, and manage driver records, documents, compliance status, and assignment readiness.",
  },
  {
    name: "Vehicles",
    description:
      "Maintain fleet records, track vehicle documents, monitor compliance, and manage service status.",
  },
  {
    name: "Riders and guardians",
    description:
      "Coordinate passenger records, guardian relationships, and the rider data that drives scheduling.",
  },
  {
    name: "Organizations and contracts",
    description:
      "Manage client organizations, service contracts, rosters, and billing relationships in one place.",
  },
  {
    name: "Ride scheduling",
    description:
      "Create and manage individual ride bookings with full visibility into pickup, drop-off, and assignment.",
  },
  {
    name: "Recurring rides",
    description:
      "Define repeating ride schedules and generate instances without manual re-entry every week.",
  },
  {
    name: "Dispatch board",
    description:
      "Monitor live service across rides, drivers, and vehicles with a day-of-operations command view.",
  },
  {
    name: "Routes",
    description:
      "Build and manage route plans that connect multiple stops, riders, and driver assignments efficiently.",
  },
  {
    name: "Invoices and payments",
    description:
      "Issue invoices, record payments, manage receivables, and maintain a clear financial audit trail.",
  },
  {
    name: "Notifications",
    description:
      "Send and track operational alerts to drivers, riders, guardians, and organization contacts.",
  },
  {
    name: "Compliance",
    description:
      "Track driver and vehicle compliance status, flag expiring documents, and resolve open issues.",
  },
  {
    name: "Incidents",
    description:
      "Record, track, and resolve operational incidents, safety events, and service complaints.",
  },
  {
    name: "Reports",
    description:
      "Access operational and financial reports that give leadership visibility across the entire program.",
  },
  {
    name: "Portals",
    description:
      "Provide drivers, riders, guardians, and organizations with secure, role-appropriate self-service access.",
  },
  {
    name: "Workspace administration",
    description:
      "Keep company workspaces separate, manage team access, and configure the tools available to each operation.",
  },
];

export function FeaturesPage() {
  return (
    <Stack spacing={{ xs: 5, md: 7 }}>
      <PublicSection
        eyebrow="The platform"
        title="One clear view. A more connected operation."
        description="Bring scheduling, dispatch, people, vehicles, and billing into a shared workspace with access tailored to each role."
      >
        <Box sx={{ mb: { xs: 4, md: 6 } }}><PlatformImage name="platform" priority /></Box>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" },
          }}
        >
          {featureModules.map((module) => (
            <PageCard key={module.name} sx={{ height: "100%" }}>
              <Stack spacing={1}>
                <Typography variant="h6">{module.name}</Typography>
                <Typography color="text.secondary">
                  {module.description}
                </Typography>
              </Stack>
            </PageCard>
          ))}
        </Box>
      </PublicSection>

      <PublicSection eyebrow="A simpler working day" title="Move the work forward, without losing the details."
        description="Replace disconnected schedules and repeated follow-ups with a workflow your team can follow from booking to completion.">
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 4, md: 6 }, alignItems: 'center' }}>
          <PlatformImage name="transformation" />
          <Stack spacing={3}>
            {[['01', 'Plan the service', 'Create trips and recurring schedules with pickup, drop-off, and rider requirements together.'],
              ['02', 'Coordinate the team', 'Assign available drivers and vehicles, and review readiness before departure.'],
              ['03', 'Follow the journey', 'See trip milestones and shared location updates, with clear communication when plans change.'],
              ['04', 'Review the outcome', 'Keep completion evidence, invoices, recorded payments, and reports connected to the service.']].map(([number, title, text]) =>
              <Stack direction="row" spacing={2} key={number}><Typography sx={{ color: '#b45408', fontWeight: 700 }}>{number}</Typography><Box><Typography variant="h6" mb={1}>{title}</Typography><Typography color="text.secondary">{text}</Typography></Box></Stack>)}
          </Stack>
        </Box>
      </PublicSection>

      <PublicCtaBand
        eyebrow="See the full story"
        title="Ready to see these features in action?"
        description="Schedule a guided walkthrough and see how the platform fits your program."
        primaryLabel="Request Demo"
        primaryTo="/contact#request-demo"
        secondaryLabel="Review pricing"
        secondaryTo="/pricing"
      />
    </Stack>
  );
}
