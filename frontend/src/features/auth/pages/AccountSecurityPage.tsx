import { Stack, Typography } from "@mui/material";
import { PageCard } from "../../../shared/components/PageCard";
import { PasswordChangeCard } from "../components/PasswordChangeCard";

export function AccountSecurityPage() {
  return (
    <Stack spacing={2.5}>
      <PageCard>
        <Stack spacing={1}>
          <Typography variant="h4">My account</Typography>
          <Typography color="text.secondary">
            Manage the credentials used to access your transportation workspace.
          </Typography>
        </Stack>
      </PageCard>
      <PasswordChangeCard />
    </Stack>
  );
}
