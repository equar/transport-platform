import { Alert, Stack } from "@mui/material";
import { PageCard } from "../../../shared/components/PageCard";
import { SectionHeader } from "../../../shared/components/SectionHeader";

export function OrganizationPortalFoundationPage() {
  return (
    <Stack spacing={3}>
      <SectionHeader
        title="Organization Portal"
        description="Organization contacts now have a dedicated portal experience with scoped routing and account isolation."
      />
      <PageCard>
        <Alert severity="info">
          Organization portal access is ready. Dashboard, roster, contract, and
          billing workflows all stay scoped to the right organization account.
        </Alert>
      </PageCard>
    </Stack>
  );
}
