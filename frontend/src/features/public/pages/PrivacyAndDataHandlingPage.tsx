import { Box, Stack, Typography } from "@mui/material";
import { PublicCtaBand } from "../components/PublicCtaBand";
import { LegalResourceNav } from "../components/LegalResourceNav";
import { PublicSection } from "../components/PublicSection";
import { PageCard } from "../../../shared/components/PageCard";

const privacyPrinciples = [
  {
    title: "Workspace-scoped access",
    description:
      "Operational data is intended to stay scoped to the workspace and user role that should see it. Public pages never expose customer operational records.",
  },
  {
    title: "Role-aware visibility",
    description:
      "Platform administrators, company teams, and portal users each work inside access boundaries designed for their responsibilities rather than sharing one unrestricted view.",
  },
  {
    title: "Operational accountability",
    description:
      "The platform is built to support auditable activity, managed updates, and clear ownership across onboarding, dispatch, billing, compliance, and portal workflows.",
  },
];

const handledDataCategories = [
  "Account and workspace identity details such as names, emails, support contacts, and role assignments.",
  "Transportation program records such as riders, guardians, drivers, vehicles, routes, schedules, invoices, and operational events.",
  "Configuration and branding details required to tailor the workspace experience and support day-to-day operations.",
  "Support and implementation information shared with the team during onboarding, rollout planning, or ongoing customer assistance.",
];

const publicHandlingNotes = [
  "Public website visits should not be used to submit sensitive transportation records or protected customer data.",
  "The public contact and demo flows are intended for evaluation, onboarding, and support coordination rather than production data exchange.",
  "If your team needs a formal review of retention, deletion, data export, or processing expectations, use the data processing support page to continue the conversation.",
];

export function PrivacyAndDataHandlingPage() {
  return (
    <Stack spacing={{ xs: 5, md: 7 }}>
      <PublicSection
        eyebrow="Privacy and data handling"
        title="Understand how the platform approaches customer data and workspace privacy."
        description="This page summarizes the platform's approach to handling operational data, user access, and public-site interactions. It is designed to help evaluation teams understand the model before formal agreements are finalized."
      >
        <Stack spacing={3}>
          <LegalResourceNav currentPath="/privacy" />
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(3, minmax(0, 1fr))",
              },
            }}
          >
            {privacyPrinciples.map((item) => (
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
        </Stack>
      </PublicSection>

      <PublicSection
        eyebrow="What the platform handles"
        title="Operational data handling is aligned with the transportation workflows teams manage every day."
        description="Customer workspaces may include account, scheduling, fleet, billing, portal, and support information needed to run transportation programs in one connected platform."
      >
        <PageCard>
          <Stack spacing={1.5}>
            {handledDataCategories.map((item) => (
              <Typography key={item} color="text.secondary">
                • {item}
              </Typography>
            ))}
          </Stack>
        </PageCard>
      </PublicSection>

      <PublicSection
        eyebrow="Public-site boundaries"
        title="The public website is intentionally separated from production workspace operations."
        description="Marketing, contact, and onboarding entry points live outside the authenticated application so teams can evaluate the platform without exposing operational records through public routes."
      >
        <PageCard>
          <Stack spacing={1.5}>
            {publicHandlingNotes.map((item) => (
              <Typography key={item} color="text.secondary">
                • {item}
              </Typography>
            ))}
          </Stack>
        </PageCard>
      </PublicSection>

      <PublicCtaBand
        eyebrow="Need a deeper review"
        title="Continue the privacy and data conversation with the right team."
        description="If your organization needs implementation, security, or data-processing review before rollout, contact the team and outline the questions you want covered."
        primaryLabel="Contact the team"
        primaryTo="/contact"
        secondaryLabel="Data processing support"
        secondaryTo="/data-processing-support"
      />
    </Stack>
  );
}
