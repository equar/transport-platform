import { useState, type FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
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
        title="We would love to hear from you."
        description="Whether you are ready to request a demo, need support, or want to explore a partnership opportunity, get in touch with the right team below."
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
                Request a product demo
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Tell us a little about your program and we will schedule time to walk you through the platform.
              </Typography>
            </Box>

            {submitted ? (
              <Alert severity="success">
                Thank you for your interest. Our team will be in touch within one business day to confirm your demo.
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
                  Request demo
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
        eyebrow="Ready to get started"
        title="Move directly into onboarding if your team is ready."
        description="Submit a demo request above or apply directly to get started with the platform today."
        primaryLabel="Apply to Join"
        primaryTo="/apply"
        secondaryLabel="Review pricing"
        secondaryTo="/pricing"
      />
    </Stack>
  );
}
