import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { PageCard } from "../../../shared/components/PageCard";

interface MarketingHighlight {
  title: string;
  description: string;
}

interface MarketingPageProps {
  eyebrow: string;
  title: string;
  description: string;
  spotlightTitle: string;
  spotlightDescription: string;
  spotlightItems: string[];
  highlights: MarketingHighlight[];
  primaryCtaLabel: string;
  primaryCtaTo: string;
  secondaryCtaLabel: string;
  secondaryCtaTo: string;
}

export function MarketingPage({
  eyebrow,
  title,
  description,
  spotlightTitle,
  spotlightDescription,
  spotlightItems,
  highlights,
  primaryCtaLabel,
  primaryCtaTo,
  secondaryCtaLabel,
  secondaryCtaTo,
}: MarketingPageProps) {
  return (
    <Stack spacing={{ xs: 4, md: 6 }}>
      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: {
            xs: "1fr",
            md: "minmax(0, 1.35fr) minmax(320px, 0.9fr)",
          },
          alignItems: "stretch",
        }}
      >
        <Stack spacing={3} justifyContent="center">
          <Chip
            label={eyebrow}
            color="secondary"
            sx={{ alignSelf: "flex-start", fontWeight: 700 }}
          />
          <Stack spacing={2}>
            <Typography
              variant="h1"
              sx={{ fontSize: { xs: "2.6rem", md: "4.5rem" }, lineHeight: 1 }}
            >
              {title}
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ maxWidth: 760, fontWeight: 400 }}
            >
              {description}
            </Typography>
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button
              component={RouterLink}
              to={primaryCtaTo}
              variant="contained"
              size="large"
            >
              {primaryCtaLabel}
            </Button>
            <Button
              component={RouterLink}
              to={secondaryCtaTo}
              variant="outlined"
              size="large"
            >
              {secondaryCtaLabel}
            </Button>
          </Stack>
        </Stack>

        <PageCard
          sx={{
            height: "100%",
            background:
              "linear-gradient(180deg, rgba(15, 76, 92, 0.08) 0%, rgba(255, 255, 255, 0.92) 100%)",
          }}
        >
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="overline" color="secondary.main">
                Operations design
              </Typography>
              <Typography variant="h4" sx={{ mt: 1 }}>
                {spotlightTitle}
              </Typography>
            </Box>
            <Typography color="text.secondary">
              {spotlightDescription}
            </Typography>
            <Stack spacing={1.5}>
              {spotlightItems.map((item) => (
                <Box
                  key={item}
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "rgba(255, 255, 255, 0.72)",
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {item}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Stack>
        </PageCard>
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
        }}
      >
        {highlights.map((highlight) => (
          <PageCard key={highlight.title} sx={{ height: "100%" }}>
            <Stack spacing={1.5}>
              <Typography variant="h5">{highlight.title}</Typography>
              <Typography color="text.secondary">
                {highlight.description}
              </Typography>
            </Stack>
          </PageCard>
        ))}
      </Box>
    </Stack>
  );
}
