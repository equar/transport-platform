import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import WifiOffRoundedIcon from "@mui/icons-material/WifiOffRounded";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import type { BusinessError } from "../api/businessError";

export function BusinessErrorState({ error, onRetry, compact = false }: { error: BusinessError; onRetry?: () => void; compact?: boolean }) {
  const Icon = error.kind === "network" ? WifiOffRoundedIcon : error.kind === "authorization" || error.kind === "authentication" ? LockOutlinedIcon : ErrorOutlineRoundedIcon;
  return (
    <Alert severity={error.kind === "validation" || error.kind === "conflict" ? "warning" : "error"} variant="outlined" sx={{ borderRadius: 2.5, p: compact ? 1 : 1.5, alignItems: "flex-start", bgcolor: "background.paper" }} icon={<Icon />}>
      <Stack spacing={1}>
        <Box><Typography fontWeight={800}>{error.title}</Typography><Typography variant="body2" sx={{ mt: .25 }}>{error.message}</Typography></Box>
        <Typography variant="caption" color="text.secondary">Reference: {error.code}</Typography>
        {onRetry && error.retryable ? <Box><Button size="small" variant="outlined" onClick={onRetry}>Try again</Button></Box> : null}
      </Stack>
    </Alert>
  );
}
