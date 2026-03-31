import { Alert, Stack } from "@mui/material";
import { PageCard } from "../../../shared/components/PageCard";
import { SectionHeader } from "../../../shared/components/SectionHeader";

export function OrganizationPortalFoundationPage() {
  return (
    <Stack spacing={3}>
      <SectionHeader
        title="Organization Portal"
        description="Portal routing, auth isolation, and shared shell foundations are now active for organization contact roles."
      />
      <PageCard>
        <Alert severity="info">
          Organization portal foundations are enabled. Scoped dashboard, roster,
          contract, and billing workflows can now be layered onto this shell
          without breaking role isolation.
        </Alert>
      </PageCard>
    </Stack>
  );
}
