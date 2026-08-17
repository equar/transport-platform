import InboxRoundedIcon from "@mui/icons-material/InboxRounded";
import { Box, Stack, Typography } from "@mui/material";

interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <Stack
      spacing={2}
      alignItems="center"
      sx={{ py: 10, px: 4, textAlign: "center" }}
    >
      <Box
        sx={{
          width: 76,
          height: 76,
          display: "grid",
          placeItems: "center",
          borderRadius: "50%",
          bgcolor: "rgba(37, 76, 99, 0.08)",
          color: "primary.main",
          "& svg": { fontSize: 30 },
        }}
      >
        <InboxRoundedIcon />
      </Box>
      <Typography variant="h5">{title}</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 460 }}>
        {description}
      </Typography>
    </Stack>
  );
}
