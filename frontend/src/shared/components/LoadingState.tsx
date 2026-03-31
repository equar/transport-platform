import { Box, CircularProgress } from "@mui/material";

export function LoadingState() {
  return (
    <Box sx={{ py: 8, display: "grid", placeItems: "center" }}>
      <CircularProgress color="secondary" />
    </Box>
  );
}
