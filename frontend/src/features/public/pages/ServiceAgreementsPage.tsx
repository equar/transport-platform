import { Box, Stack, Typography } from "@mui/material";
import { PublicCtaBand } from "../components/PublicCtaBand";
import { LegalResourceNav } from "../components/LegalResourceNav";
import { PublicSection } from "../components/PublicSection";
import { PageCard } from "../../../shared/components/PageCard";

const agreementAreas = [
  {
    title: "Implementation scope",
    description:
      "Service agreements are used to confirm rollout scope, environment expectations, timeline alignment, and the responsibilities shared between your team and ours.",
  },
  {
    title: "Support alignment",
    description:
      "Ongoing support expectations, communication channels, onboarding coordination, and operational handoff details are defined as part of the commercial engagement.",
  },
  {
    title: "Platform configuration",
    description:
      "Workspace setup, branding, role configuration, portal access, and implementation sequencing are typically reviewed before launch so the final agreement reflects the program accurately.",
  },
];

const expectationPoints = [
  "Commercial terms, pricing, rollout milestones, and customer-specific obligations are finalized directly with the team rather than published as one generic public contract.",
  "Implementation plans should reflect the transportation model, stakeholder groups, compliance posture, and support needs of the program being launched.",
  "If your team needs a formal review of contract language, onboarding responsibilities, or support structure, the best next step is to start a guided commercial conversation.",
];

export function ServiceAgreementsPage() {
  return (
    <Stack spacing={{ xs: 5, md: 7 }}>
      <PublicSection
        eyebrow="Service agreements"
        title="Know how rollout, support, and commercial expectations are structured."
        description="This page explains how service agreements are approached for the platform. It is informational and intended to help evaluation teams understand how scope, implementation, and support expectations are typically aligned."
      >
        <Stack spacing={3}>
          <LegalResourceNav currentPath="/service-agreements" />
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
            {agreementAreas.map((item) => (
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
        eyebrow="What to expect"
        title="The final agreement should match the reality of your program."
        description="Transportation programs vary by service model, organizational structure, portal needs, and operating complexity. The agreement process is intended to reflect those differences rather than reduce every rollout to the same package."
      >
        <PageCard>
          <Stack spacing={1.5}>
            {expectationPoints.map((item) => (
              <Typography key={item} color="text.secondary">
                • {item}
              </Typography>
            ))}
          </Stack>
        </PageCard>
      </PublicSection>

      <PublicSection
        eyebrow="Important note"
        title="This page is a summary, not a substitute for signed commercial documents."
        description="Formal service commitments, customer-specific implementation details, and negotiated terms are confirmed through your direct engagement with the team."
      >
        <PageCard>
          <Typography color="text.secondary">
            Use this page to understand how the process works, then move into a
            guided discussion when your team is ready to review scope,
            implementation planning, and final commercial terms.
          </Typography>
        </PageCard>
      </PublicSection>

      <PublicCtaBand
        eyebrow="Ready to review scope"
        title="Start the agreement conversation with rollout context in hand."
        description="Request a demo or contact the team to review the transportation model, support expectations, and implementation scope that should shape your agreement."
        primaryLabel="Request Demo"
        primaryTo="/contact#request-demo"
        secondaryLabel="Contact the team"
        secondaryTo="/contact"
      />
    </Stack>
  );
}
