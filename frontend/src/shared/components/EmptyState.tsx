import InboxRoundedIcon from "@mui/icons-material/InboxRounded";
import { Box, Stack, Typography } from "@mui/material";

interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <Stack
      spacing={1.25}
      alignItems="center"
      sx={{ py: 4, px: 2.5, textAlign: "center" }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          display: "grid",
          placeItems: "center",
          borderRadius: "50%",
          bgcolor: "rgba(37, 76, 99, 0.08)",
          color: "primary.main",
          "& svg": { fontSize: 22 },
        }}
      >
        <InboxRoundedIcon />
      </Box>
      <Typography variant="h6">{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 460 }}>
        {description}
      </Typography>
    </Stack>
  );
}
