import { Box, Stack, Typography } from "@mui/material";
import { PublicCtaBand } from "../components/PublicCtaBand";
import { LegalResourceNav } from "../components/LegalResourceNav";
import { PublicSection } from "../components/PublicSection";
import { PageCard } from "../../../shared/components/PageCard";

const supportTopics = [
  {
    title: "Processing questions",
    description:
      "Use this channel when your team needs clarification on how customer data is used to support onboarding, operations, billing, reporting, or portal access within the platform.",
  },
  {
    title: "Access and retention review",
    description:
      "Reach out when your stakeholders need to discuss data access expectations, role boundaries, retention considerations, or how operational data is managed across workspaces.",
  },
  {
    title: "Implementation coordination",
    description:
      "Data-processing discussions often overlap with onboarding, rollout sequencing, and support planning, so it helps to bring those questions together early in evaluation.",
  },
];

const preparationChecklist = [
  "Summarize the transportation program, stakeholder groups, and workspace model your team expects to support.",
  "List any data-processing, privacy, retention, or review questions your legal, procurement, or security teams need answered.",
  "Include the best contact details for the person coordinating the request so follow-up can stay organized.",
];

export function DataProcessingSupportPage() {
  return (
    <Stack spacing={{ xs: 5, md: 7 }}>
      <PublicSection
        eyebrow="Data processing support"
        title="Bring privacy, processing, and support questions to the right conversation."
        description="This page is for teams that need more detailed discussion of privacy, data handling, or processing expectations before rollout. It helps organize the conversation before formal documents and implementation reviews are finalized."
      >
        <Stack spacing={3}>
          <LegalResourceNav currentPath="/data-processing-support" />
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
            {supportTopics.map((item) => (
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
        eyebrow="How to prepare"
        title="A little context helps the review move faster."
        description="The most useful data-processing conversations start with clear program context, clear stakeholder questions, and a practical sense of the rollout being planned."
      >
        <PageCard>
          <Stack spacing={1.5}>
            {preparationChecklist.map((item) => (
              <Typography key={item} color="text.secondary">
                • {item}
              </Typography>
            ))}
          </Stack>
        </PageCard>
      </PublicSection>

      <PublicSection
        eyebrow="Where to continue"
        title="Use the existing support and contact channels to continue the conversation."
        description="This page does not replace a support workflow. It helps direct privacy and data-processing questions into the right commercial, onboarding, or support discussion."
      >
        <PageCard>
          <Stack spacing={1.5}>
            <Typography color="text.secondary">
              General support and onboarding coordination:
              support@transportplatform.com
            </Typography>
            <Typography color="text.secondary">
              Commercial and evaluation discussions: sales@transportplatform.com
            </Typography>
            <Typography color="text.secondary">
              You can also use the contact page to route the request to the
              right team.
            </Typography>
          </Stack>
        </PageCard>
      </PublicSection>

      <PublicCtaBand
        eyebrow="Continue the conversation"
        title="Route your processing questions through the right team."
        description="Use the contact page when your team is ready to discuss privacy, processing, onboarding, or implementation needs in more detail."
        primaryLabel="Contact the team"
        primaryTo="/contact"
        secondaryLabel="Security overview"
        secondaryTo="/security"
      />
    </Stack>
  );
}
