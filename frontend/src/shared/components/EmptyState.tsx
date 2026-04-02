import InboxRoundedIcon from "@mui/icons-material/InboxRounded";
import { Box, Stack, Typography } from "@mui/material";

interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <Stack
      spacing={1.5}
      alignItems="center"
      sx={{ py: 8, px: 3, textAlign: "center" }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          display: "grid",
          placeItems: "center",
          borderRadius: "50%",
          bgcolor: "rgba(15, 76, 92, 0.08)",
          color: "primary.main",
        }}
      >
        <InboxRoundedIcon />
      </Box>
      <Typography variant="h5">{title}</Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 420 }}>
        {description}
      </Typography>
    </Stack>
  );
}
