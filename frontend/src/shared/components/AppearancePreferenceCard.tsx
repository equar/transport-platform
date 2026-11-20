import { Alert, Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { PageCard } from "./PageCard";
import { useAppearancePreference, type AppearancePreference } from "../theme/AppearancePreferenceContext";

export function AppearancePreferenceCard() {
  const { preference, setPreference, error } = useAppearancePreference();
  return (
    <PageCard>
      <Stack spacing={2}>
        <Typography variant="h5">Appearance</Typography>
        <Typography color="text.secondary">Choose Light or Dark for this account. Saved in this browser.</Typography>
        <ToggleButtonGroup exclusive value={preference} aria-label="Theme" onChange={(_, value: AppearancePreference | null) => { if (value) setPreference(value); }} sx={{ alignSelf: "flex-start" }}>
          <ToggleButton value="light">Light</ToggleButton>
          <ToggleButton value="dark">Dark</ToggleButton>
        </ToggleButtonGroup>
        {error ? <Alert severity="error">{error}</Alert> : null}
      </Stack>
    </PageCard>
  );
}
