import { Box, Stack, Typography } from "@mui/material";
import { PublicCtaBand } from "../components/PublicCtaBand";
import { PublicSection } from "../components/PublicSection";
import { PageCard } from "../../../shared/components/PageCard";

const featureModules = [
  {
    name: "Users and roles",
    description: "Manage platform and company users with role-based access control and workspace-aware permissions.",
  },
  {
    name: "Drivers",
    description: "Onboard, track, and manage driver records, documents, compliance status, and assignment readiness.",
  },
  {
    name: "Vehicles",
    description: "Maintain fleet records, track vehicle documents, monitor compliance, and manage service status.",
  },
  {
    name: "Riders and guardians",
    description: "Coordinate passenger records, guardian relationships, and the rider data that drives scheduling.",
  },
  {
    name: "Organizations and contracts",
    description: "Manage client organizations, service contracts, rosters, and billing relationships in one place.",
  },
  {
    name: "Ride scheduling",
    description: "Create and manage individual ride bookings with full visibility into pickup, drop-off, and assignment.",
  },
  {
    name: "Recurring rides",
    description: "Define repeating ride schedules and generate instances without manual re-entry every week.",
  },
  {
    name: "Dispatch board",
    description: "Monitor live service across rides, drivers, and vehicles with a day-of-operations command view.",
  },
  {
    name: "Routes",
    description: "Build and manage route plans that connect multiple stops, riders, and driver assignments efficiently.",
  },
  {
    name: "Invoices and payments",
    description: "Issue invoices, record payments, manage receivables, and maintain a clear financial audit trail.",
  },
  {
    name: "Notifications",
    description: "Send and track operational alerts to drivers, riders, guardians, and organization contacts.",
  },
  {
    name: "Compliance",
    description: "Track driver and vehicle compliance status, flag expiring documents, and resolve open issues.",
  },
  {
    name: "Incidents",
    description: "Record, track, and resolve operational incidents, safety events, and service complaints.",
  },
  {
    name: "Reports",
    description: "Access operational and financial reports that give leadership visibility across the entire program.",
  },
  {
    name: "Portals",
    description: "Provide drivers, riders, guardians, and organizations with secure, role-appropriate self-service access.",
  },
  {
    name: "SaaS features",
    description: "Manage subscription plans, feature flags, and tenant provisioning from the platform administration layer.",
  },
];

export function FeaturesPage() {
  return (
    <Stack spacing={{ xs: 5, md: 7 }}>
      <PublicSection
        eyebrow="Feature architecture"
        title="Everything you need to run a modern transportation operation, from onboarding to invoicing."
        description="Transport Platform covers the full operational stack. Here is a breakdown of the major modules your team will work with every day."
      >
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

      <PublicSection
        eyebrow="Why it matters"
        title="One system. Every workflow your team needs."
        description="From rider onboarding to driver compliance, billing to reporting, every module is purpose-built for transportation operations and designed to work together out of the box."
      >
        <PageCard>
          <Typography color="text.secondary">
            Instead of assembling a patchwork of admin portals, dispatch tools,
            and finance systems, your team gets a single platform where every
            role has the right surface, every workflow connects, and leadership
            maintains full operational visibility.
          </Typography>
        </PageCard>
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
