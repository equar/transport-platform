import { useState, type FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
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
        title="Start the conversation with the right team."
        description="Whether you are evaluating the platform, coordinating onboarding, or need workspace support, use the channels below to reach the team that can help."
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
                Request a tailored walkthrough
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Share a few details about your program. This form captures the
                information your sales or onboarding workflow will use.
              </Typography>
            </Box>

            {submitted ? (
              <Alert severity="success">
                Thanks. Your request has been captured and is ready for your
                sales workflow.
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
        eyebrow="Ready to move beyond a demo"
        title="Start onboarding when your team is ready."
        description="Use the demo request above to start the conversation, or move directly into the application process if you already know the platform is a fit."
        primaryLabel="Apply to Join"
        primaryTo="/apply"
        secondaryLabel="Review pricing"
        secondaryTo="/pricing"
      />
    </Stack>
  );
}
