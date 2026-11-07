import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { PublicCtaBand } from "../components/PublicCtaBand";
import { PublicSection } from "../components/PublicSection";
import { PageCard } from "../../../shared/components/PageCard";

const pricingTiers = [
  {
    name: "Starter",
    subtitle: "For early-stage rollout and public-to-private platform launch",
    price: "Custom",
    points: [
      "Public website shell, branded login, and onboarding entry points",
      "Platform administration tools and workspace-ready setup",
      "Structured implementation planning for initial launch",
    ],
  },
  {
    name: "Growth",
    subtitle:
      "For active operational rollout across scheduling, dispatch, and billing",
    price: "Custom",
    points: [
      "Company administration and role-aware operational modules",
      "Portal access patterns for drivers, riders, guardians, and organizations",
      "Billing, notifications, reporting, and dispatch coordination support",
    ],
  },
  {
    name: "Enterprise",
    subtitle: "For scaled programs, governance, and commercial expansion",
    price: "Custom",
    points: [
      "Subscription controls and feature management for growing programs",
      "Program-specific implementation and integration planning",
      "Environment, security, and rollout alignment for larger organizations",
    ],
  },
];

export function PricingPage() {
  return (
    <Stack spacing={{ xs: 4, md: 6 }}>
      <PublicSection
        eyebrow="Pricing"
        title="Pricing that scales with your transportation program."
        description="Choose the rollout approach that matches your current stage, then tailor the final implementation plan with our team."
      >
        <></>
      </PublicSection>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
        }}
      >
        {pricingTiers.map((tier, index) => (
          <PageCard
            key={tier.name}
            sx={{
              height: "100%",
              borderColor: index === 1 ? "primary.main" : "divider",
            }}
          >
            <Stack spacing={2} sx={{ height: "100%" }}>
              <Box>
                {index === 1 ? (
                  <Chip
                    label="Most requested"
                    color="secondary"
                    size="small"
                    sx={{ mb: 1.5 }}
                  />
                ) : null}
                <Typography variant="overline" color="secondary.main">
                  {tier.subtitle}
                </Typography>
                <Typography variant="h4" sx={{ mt: 1 }}>
                  {tier.name}
                </Typography>
                <Typography variant="h5" sx={{ mt: 1.5 }}>
                  {tier.price}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  Talk with our team for rollout planning, implementation scope,
                  and program-specific pricing.
                </Typography>
              </Box>
              <Stack spacing={1.25} sx={{ flexGrow: 1 }}>
                {tier.points.map((point) => (
                  <Typography key={point} color="text.secondary">
                    {point}
                  </Typography>
                ))}
              </Stack>
              <Button
                component={RouterLink}
                to="/contact#request-demo"
                variant={index === 1 ? "contained" : "outlined"}
              >
                Request Demo
              </Button>
            </Stack>
          </PageCard>
        ))}
      </Box>

      <PublicSection
        eyebrow="Custom pricing"
        title="Need a tailored rollout plan?"
        description="The platform supports specialized transportation models, multi-entity programs, phased launches, and enterprise governance requirements."
      >
        <PageCard>
          <Typography color="text.secondary">
            Custom pricing is available for organizations that need contract
            transportation workflows, multiple programs, portal expansion, or a
            deployment plan that spans more than one service line. Use a guided
            pricing conversation to shape the right rollout instead of forcing
            your team into the wrong package.
          </Typography>
        </PageCard>
      </PublicSection>

      <PublicCtaBand
        eyebrow="Commercial next step"
        title="Ready to compare the right plan for your program?"
        description="Review the available rollout tiers, then request a guided walkthrough or begin the application process when your team is ready."
        primaryLabel="Request Demo"
        primaryTo="/contact#request-demo"
        secondaryLabel="Apply to Join"
        secondaryTo="/apply"
      />
    </Stack>
  );
}
