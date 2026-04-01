import { useState, type FormEvent } from "react";
import { Alert, Box, Button, Chip, Stack, TextField, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { PublicCtaBand } from "../components/PublicCtaBand";
import { PublicSection } from "../components/PublicSection";
import { PageCard } from "../../../shared/components/PageCard";

const contactChannels = [
  {
    title: "Sales and demos",
    description:
      "Coordinate a working session for platform evaluation, implementation planning, and deployment sequencing.",
    detail: "sales@transportplatform.com",
  },
  {
    title: "Customer support",
    description:
      "Reach the operations support team for workspace access, onboarding coordination, and deployment questions.",
    detail: "support@transportplatform.com",
  },
  {
    title: "Partnerships",
    description:
      "Discuss broker, care-network, or transportation ecosystem partnerships and integration opportunities.",
    detail: "partnerships@transportplatform.com",
  },
];

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <Stack spacing={{ xs: 4, md: 6 }}>
      <PublicSection
        eyebrow="Contact"
        title="Route sales, support, and implementation conversations through one credible public entry point."
        description="This page now gives first-time visitors a clearer path for business contact, support questions, and demo requests while keeping the actual submission wiring ready for a later integration phase."
      >
        <></>
      </PublicSection>

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
        }}
      >
        {contactChannels.map((channel) => (
          <PageCard key={channel.title} sx={{ height: "100%" }}>
            <Stack spacing={1.5}>
              <Typography variant="h5">{channel.title}</Typography>
              <Typography color="text.secondary">
                {channel.description}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {channel.detail}
              </Typography>
            </Stack>
          </PageCard>
        ))}
      </Box>

      <Box id="request-demo">
        <PageCard sx={{ maxWidth: 920 }}>
          <Stack spacing={3} component="form" onSubmit={handleSubmit}>
            <Box>
              <Typography variant="overline" color="secondary.main">
                Request Demo
              </Typography>
              <Typography variant="h3" sx={{ mt: 1 }}>
                Capture the request flow now, wire the sales workflow later.
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                This phase establishes the public-site structure only. The
                request form below is intentionally presentation-first so the
                eventual CRM or ticketing integration can be added without
                reshaping the page.
              </Typography>
            </Box>

            {submitted ? (
              <Alert severity="success">
                Demo request captured in the public shell. Connect this form to your CRM or sales workflow in a later phase without changing the page structure.
              </Alert>
            ) : null}

            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(2, minmax(0, 1fr))",
                },
              }}
            >
              <TextField label="Full Name" placeholder="Jordan Avery" />
              <TextField label="Company" placeholder="Northbound Mobility" />
              <TextField
                label="Work Email"
                type="email"
                placeholder="jordan@northboundmobility.com"
              />
              <TextField label="Phone" placeholder="(555) 010-2200" />
              <TextField
                label="What are you solving for?"
                placeholder="Tenant onboarding, dispatch visibility, rider portals, billing controls..."
                multiline
                minRows={4}
                sx={{ gridColumn: { md: "1 / -1" } }}
              />
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                sx={{ gridColumn: { md: "1 / -1" } }}
              >
                <Button type="submit" variant="contained" size="large">
                  Request demo workflow
                </Button>
                <Button
                  component={RouterLink}
                  to="/apply"
                  variant="outlined"
                  size="large"
                >
                  Apply to Join
                </Button>
              </Stack>
            </Box>
          </Stack>
        </PageCard>
      </Box>

      <PublicCtaBand
        eyebrow="Need a formal next step"
        title="Move directly into onboarding if your team is ready."
        description="Some visitors will want a demo first. Others are already ready to begin the application process. The contact flow now supports both journeys."
        primaryLabel="Apply to Join"
        primaryTo="/apply"
        secondaryLabel="Review pricing"
        secondaryTo="/pricing"
      />
    </Stack>
  );
}
