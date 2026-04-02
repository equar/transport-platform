import {
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { PublicCtaBand } from "../../public/components/PublicCtaBand";
import { PublicSection } from "../../public/components/PublicSection";
import { PageCard } from "../../../shared/components/PageCard";
import {
  companyApplicationsApi,
  type CompanyApplicationSubmissionPayload,
} from "../api/companyApplicationsApi";
import { useToast } from "../../../shared/providers/ToastProvider";

const businessTypes = [
  "Carrier",
  "Broker",
  "Fleet Operator",
  "Paratransit",
  "Courier",
  "Mixed Operations",
];
const serviceTypes = [
  "DISPATCH",
  "FLEET",
  "LAST_MILE",
  "LINE_HAUL",
  "PARATRANSIT",
];

const initialForm: CompanyApplicationSubmissionPayload = {
  legalCompanyName: "",
  dbaName: "",
  contactFirstName: "",
  contactLastName: "",
  email: "",
  phone: "",
  businessType: businessTypes[0],
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  zipCode: "",
  country: "",
  requestedServiceTypes: [],
  fleetSize: 0,
  numberOfDrivers: 0,
  notes: "",
};

const applyBenefits = [
  "Launch with a polished public site and a branded sign-in experience",
  "Standardize workspace setup, operational modules, and role-aware access patterns",
  "Prepare for dispatch, billing, compliance, portal rollout, and SaaS growth",
];

const processSteps = [
  {
    title: "Apply",
    description:
      "Share your company profile, service footprint, and operational requirements through the onboarding form.",
  },
  {
    title: "Review",
    description:
      "A platform administrator reviews your submission, requested service types, and rollout fit.",
  },
  {
    title: "Launch planning",
    description:
      "Qualified teams move into onboarding, implementation, and workspace activation planning.",
  },
];

function toStringArray(value: string | string[]) {
  return Array.isArray(value)
    ? value
    : value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}

export function PublicCompanyApplicationPage() {
  const { showSuccess, showError } = useToast();
  const [form, setForm] =
    useState<CompanyApplicationSubmissionPayload>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submittedNumber, setSubmittedNumber] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await companyApplicationsApi.submit(form);
      setSubmittedNumber(response.applicationNumber);
      setForm(initialForm);
      showSuccess("Application submitted successfully.");
    } catch {
      showError(
        "The application could not be submitted. Please review the form and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Stack spacing={{ xs: 4, md: 6 }}>
      <PublicSection
        eyebrow="Apply to Join"
        title="Start the onboarding conversation with a clear, enterprise-ready application path."
        description="Understand the value of applying, what happens next, and how the form fits into the broader onboarding journey."
      >
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
          }}
        >
          {applyBenefits.map((benefit) => (
            <PageCard key={benefit} sx={{ height: "100%" }}>
              <Typography color="text.secondary">{benefit}</Typography>
            </PageCard>
          ))}
        </Box>
      </PublicSection>

      <PublicSection
        eyebrow="Process"
        title="A simple three-step path from interest to rollout planning."
        description="Teams should understand what happens after they apply, not just which fields they need to complete."
      >
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
          }}
        >
          {processSteps.map((step, index) => (
            <PageCard key={step.title} sx={{ height: "100%" }}>
              <Stack spacing={1.5}>
                <Chip
                  label={`Step ${index + 1}`}
                  color="secondary"
                  sx={{ alignSelf: "flex-start", fontWeight: 700 }}
                />
                <Typography variant="h5">{step.title}</Typography>
                <Typography color="text.secondary">
                  {step.description}
                </Typography>
              </Stack>
            </PageCard>
          ))}
        </Box>
      </PublicSection>

      <PageCard sx={{ maxWidth: 1120, mx: "auto" }}>
        <Stack spacing={3} component="form" onSubmit={handleSubmit}>
          <Box>
            <Typography variant="overline" color="secondary.main">
              Onboarding application
            </Typography>
            <Typography variant="h3">
              Submit your company application to join the platform.
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Provide your company details, operating footprint, and requested
              service capabilities. A platform administrator will review the
              submission and contact you with the next onboarding steps.
            </Typography>
          </Box>

          {submittedNumber ? (
            <Alert severity="success">
              Application submitted successfully. Reference number:{" "}
              {submittedNumber}. Your team can expect follow-up for onboarding
              and rollout planning.
            </Alert>
          ) : null}

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Legal Company Name"
              value={form.legalCompanyName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  legalCompanyName: event.target.value,
                }))
              }
              required
            />
            <TextField
              label="DBA Name"
              value={form.dbaName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  dbaName: event.target.value,
                }))
              }
            />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Contact First Name"
              value={form.contactFirstName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  contactFirstName: event.target.value,
                }))
              }
              required
            />
            <TextField
              label="Contact Last Name"
              value={form.contactLastName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  contactLastName: event.target.value,
                }))
              }
              required
            />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              required
            />
            <TextField
              label="Phone"
              value={form.phone}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
              required
            />
          </Stack>
          <TextField
            label="Business Type"
            select
            value={form.businessType}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                businessType: event.target.value,
              }))
            }
          >
            {businessTypes.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Address Line 1"
            value={form.addressLine1}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                addressLine1: event.target.value,
              }))
            }
            required
          />
          <TextField
            label="Address Line 2"
            value={form.addressLine2}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                addressLine2: event.target.value,
              }))
            }
          />
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="City"
              value={form.city}
              onChange={(event) =>
                setForm((current) => ({ ...current, city: event.target.value }))
              }
              required
            />
            <TextField
              label="State"
              value={form.state}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  state: event.target.value,
                }))
              }
              required
            />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="ZIP Code"
              value={form.zipCode}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  zipCode: event.target.value,
                }))
              }
              required
            />
            <TextField
              label="Country"
              value={form.country}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  country: event.target.value,
                }))
              }
              required
            />
          </Stack>
          <TextField
            label="Requested Service Types"
            select
            SelectProps={{ multiple: true }}
            value={form.requestedServiceTypes}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                requestedServiceTypes: toStringArray(event.target.value),
              }))
            }
            required
          >
            {serviceTypes.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Fleet Size"
              type="number"
              value={form.fleetSize}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  fleetSize: Number(event.target.value),
                }))
              }
              inputProps={{ min: 0 }}
            />
            <TextField
              label="Number of Drivers"
              type="number"
              value={form.numberOfDrivers}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  numberOfDrivers: Number(event.target.value),
                }))
              }
              inputProps={{ min: 0 }}
            />
          </Stack>
          <TextField
            label="Notes"
            multiline
            minRows={4}
            value={form.notes}
            onChange={(event) =>
              setForm((current) => ({ ...current, notes: event.target.value }))
            }
          />
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ sm: "center" }}
          >
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </Button>
            <Typography color="text.secondary">
              A platform administrator will review your request and respond with
              onboarding guidance.
            </Typography>
          </Stack>
        </Stack>
      </PageCard>

      <PublicCtaBand
        eyebrow="Need a demo first"
        title="You do not have to commit before your team sees the platform."
        description="Some teams are ready to apply immediately. Others need a walkthrough first. Both paths stay clear and consistent."
        primaryLabel="Request Demo"
        primaryTo="/contact#request-demo"
        secondaryLabel="Review features"
        secondaryTo="/features"
      />
    </Stack>
  );
}
