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
        title="Create a pricing conversation that feels enterprise-ready from the first visit."
        description="This page now frames packaging in a way that supports product growth, implementation scoping, and custom program discussions without pretending complex transportation deployments can be reduced to a single fixed plan."
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
              boxShadow:
                index === 1 ? "0 20px 50px rgba(15, 76, 92, 0.12)" : undefined,
            }}
          >
            <Stack spacing={2} sx={{ height: "100%" }}>
              <Box>
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
                  Contact sales for program-specific pricing and rollout design.
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
        title="Need something more tailored?"
        description="The platform supports custom pricing conversations for specialized transportation models, multi-entity programs, phased rollouts, and enterprise governance requirements."
      >
        <PageCard>
          <Typography color="text.secondary">
            Custom pricing is available for organizations that need contract
            transportation workflows, multi-program governance, portal
            expansion, or a deployment plan that spans multiple service lines.
            Request a demo to shape the right rollout rather than forcing your
            program into the wrong package.
          </Typography>
        </PageCard>
      </PublicSection>

      <PublicCtaBand
        eyebrow="Commercial next step"
        title="Move from plan comparison into a real sales conversation."
        description="Visitors now have enough pricing context to decide whether they should request a demo, apply to join, or start a solution review with the team."
        primaryLabel="Request Demo"
        primaryTo="/contact#request-demo"
        secondaryLabel="Apply to Join"
        secondaryTo="/apply"
      />
    </Stack>
  );
}
