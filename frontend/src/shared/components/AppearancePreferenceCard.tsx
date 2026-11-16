import { MenuItem, Stack, TextField, Typography } from "@mui/material";
import { PageCard } from "./PageCard";
import { useAppearancePreference } from "../theme/AppearancePreferenceContext";

export function AppearancePreferenceCard() {
  const { preference, setPreference, error } = useAppearancePreference();

  return (
    <PageCard>
      <Stack spacing={2}>
        <Typography variant="h5">Appearance</Typography>
        <Typography color="text.secondary">
          Choose a theme for this account. System follows your device or browser
          setting.
        </Typography>
        <TextField
          select
          label="Theme"
          value={preference}
          onChange={(event) =>
            setPreference(event.target.value as typeof preference)
          }
          error={Boolean(error)}
          helperText={error ?? "Saved for this account in this browser."}
          fullWidth
        >
          <MenuItem value="system">System</MenuItem>
          <MenuItem value="light">Light</MenuItem>
          <MenuItem value="dark">Dark</MenuItem>
        </TextField>
      </Stack>
    </PageCard>
  );
}
