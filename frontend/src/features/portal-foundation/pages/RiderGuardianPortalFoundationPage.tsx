import { Alert, Stack } from "@mui/material";
import { PageCard } from "../../../shared/components/PageCard";
import { SectionHeader } from "../../../shared/components/SectionHeader";

export function RiderGuardianPortalFoundationPage() {
  return (
    <Stack spacing={3}>
      <SectionHeader
        title="Rider And Guardian Portal"
        description="Riders and guardians now have a dedicated portal experience with role-appropriate routing and account isolation."
      />
      <PageCard>
        <Alert severity="info">
          Rider and guardian self-service access is ready. Ride, billing, and
          profile workflows all stay within this dedicated portal experience.
        </Alert>
      </PageCard>
    </Stack>
  );
}
