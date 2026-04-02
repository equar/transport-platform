import { Box, Stack, Typography } from "@mui/material";
import { PublicCtaBand } from "../components/PublicCtaBand";
import { LegalResourceNav } from "../components/LegalResourceNav";
import { PublicSection } from "../components/PublicSection";
import { PageCard } from "../../../shared/components/PageCard";

const securityHighlights = [
  {
    title: "Authenticated application access",
    description:
      "The platform uses authenticated application access for API activity, while public and health endpoints stay intentionally separate from protected operational routes.",
  },
  {
    title: "Role-based route control",
    description:
      "Frontend navigation reflects role-aware workspace access, while backend authorization remains the source of truth for protected actions and data visibility.",
  },
  {
    title: "Tenant-aware boundaries",
    description:
      "Workspace isolation is a core part of the operating model so platform oversight does not collapse the access boundaries that protect company data.",
  },
];

const operationalSafeguards = [
  "Protected routes, scoped access, and portal-specific experiences are designed to reduce accidental overexposure across different user groups.",
  "Operational changes are intended to remain auditable so customer teams can trace ownership and accountability across key workflows.",
  "Public pages, authenticated workspaces, and role-specific portals are intentionally separated to keep evaluation and production usage on distinct surfaces.",
];

export function SecurityOverviewPage() {
  return (
    <Stack spacing={{ xs: 5, md: 7 }}>
      <PublicSection
        eyebrow="Security overview"
        title="Review the platform's access and isolation model before your team rolls out."
        description="This page provides a high-level summary of the platform's security approach based on the current architecture. It is intended for evaluation and planning conversations rather than deep implementation documentation."
      >
        <Stack spacing={3}>
          <LegalResourceNav currentPath="/security" />
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
            {securityHighlights.map((item) => (
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
        eyebrow="Operational safeguards"
        title="Security is designed to support real transportation workflows, not sit beside them."
        description="The platform architecture is structured so authentication, role visibility, tenant isolation, and portal separation stay aligned with the day-to-day operation of the product."
      >
        <PageCard>
          <Stack spacing={1.5}>
            {operationalSafeguards.map((item) => (
              <Typography key={item} color="text.secondary">
                • {item}
              </Typography>
            ))}
          </Stack>
        </PageCard>
      </PublicSection>

      <PublicSection
        eyebrow="Deeper review"
        title="Security review can continue as part of the implementation process."
        description="If your team needs more detail on access controls, isolation boundaries, deployment posture, or rollout governance, the next step is a direct review with the platform team."
      >
        <PageCard>
          <Typography color="text.secondary">
            This overview is intentionally high level. Customer-specific
            security questions, review requirements, and rollout considerations
            are best handled through a guided evaluation and implementation
            discussion.
          </Typography>
        </PageCard>
      </PublicSection>

      <PublicCtaBand
        eyebrow="Need a security discussion"
        title="Bring security, rollout, and data questions into one review."
        description="Contact the team when your stakeholders are ready to review security expectations alongside implementation planning and workspace setup."
        primaryLabel="Contact the team"
        primaryTo="/contact"
        secondaryLabel="Privacy and data handling"
        secondaryTo="/privacy"
      />
    </Stack>
  );
}
