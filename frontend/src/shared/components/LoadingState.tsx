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
        px: 3,
        minHeight,
        display: "grid",
        placeItems: "center",
      }}
    >
      <Stack spacing={1.5} alignItems="center" textAlign="center">
        <Box
          sx={{
            width: 64,
            height: 64,
            display: "grid",
            placeItems: "center",
            borderRadius: "50%",
            bgcolor: "rgba(196, 106, 34, 0.08)",
          }}
        >
          <CircularProgress color="secondary" size={28} />
        </Box>
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
