import { Box, CircularProgress, Stack, Typography } from "@mui/material";

interface LoadingStateProps {
  title?: string;
  description?: string;
  minHeight?: number | string;
}

export function LoadingState({
  title = "Loading this view",
  description = "Please wait while the latest workspace data is prepared.",
  minHeight = 240,
}: LoadingStateProps) {
  return (
    <Box
      sx={{
        py: 8,
        minHeight,
        display: "grid",
        placeItems: "center",
      }}
    >
      <Stack spacing={1.5} alignItems="center" textAlign="center">
        <CircularProgress color="secondary" />
        <Typography variant="h6">{title}</Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: 360 }}
        >
          {description}
        </Typography>
      </Stack>
    </Box>
  );
}
