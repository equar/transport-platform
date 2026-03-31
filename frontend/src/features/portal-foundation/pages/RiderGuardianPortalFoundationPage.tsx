import { Alert, Stack } from "@mui/material";
import { PageCard } from "../../../shared/components/PageCard";
import { SectionHeader } from "../../../shared/components/SectionHeader";

export function RiderGuardianPortalFoundationPage() {
  return (
    <Stack spacing={3}>
      <SectionHeader
        title="Rider And Guardian Portal"
        description="Portal routing, auth isolation, and shared shell foundations are now active for rider and guardian roles."
      />
      <PageCard>
        <Alert severity="info">
          Rider and guardian self-service foundations are enabled. The deeper
          ride, billing, and profile workflows will build on this scoped portal
          shell.
        </Alert>
      </PageCard>
    </Stack>
  );
}
