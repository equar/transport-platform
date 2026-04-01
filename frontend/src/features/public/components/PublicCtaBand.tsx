import { Box, Button, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { PageCard } from "../../../shared/components/PageCard";

interface PublicCtaBandProps {
  eyebrow: string;
  title: string;
  description: string;
  primaryLabel: string;
  primaryTo: string;
  secondaryLabel?: string;
  secondaryTo?: string;
}

export function PublicCtaBand({
  eyebrow,
  title,
  description,
  primaryLabel,
  primaryTo,
  secondaryLabel,
  secondaryTo,
}: PublicCtaBandProps) {
  return (
    <PageCard
      sx={{
        background:
          "linear-gradient(135deg, rgba(15, 76, 92, 0.12) 0%, rgba(255, 255, 255, 0.95) 55%, rgba(196, 106, 34, 0.1) 100%)",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.2fr) auto" },
          alignItems: "center",
        }}
      >
        <Stack spacing={1.5}>
          <Typography variant="overline" color="secondary.main">
            {eyebrow}
          </Typography>
          <Typography variant="h3">{title}</Typography>
          <Typography color="text.secondary">{description}</Typography>
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button
            component={RouterLink}
            to={primaryTo}
            variant="contained"
            size="large"
          >
            {primaryLabel}
          </Button>
          {secondaryLabel && secondaryTo ? (
            <Button
              component={RouterLink}
              to={secondaryTo}
              variant="outlined"
              size="large"
            >
              {secondaryLabel}
            </Button>
          ) : null}
        </Stack>
      </Box>
    </PageCard>
  );
}
