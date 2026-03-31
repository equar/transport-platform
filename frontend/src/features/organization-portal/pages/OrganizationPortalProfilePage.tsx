import {
  Alert,
  Box,
  Button,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { LoadingState } from "../../../shared/components/LoadingState";
import { PageCard } from "../../../shared/components/PageCard";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { useToast } from "../../../shared/providers/ToastProvider";
import { formatDateTime } from "../../../shared/utils/format";
import {
  organizationPortalApi,
  type OrganizationPortalProfilePayload,
  type OrganizationPortalProfileRecord,
} from "../api/organizationPortalApi";

const communicationMethods = ["", "PHONE", "SMS", "EMAIL"] as const;

function toProfilePayload(
  profile: OrganizationPortalProfileRecord,
): OrganizationPortalProfilePayload {
  return {
    title: profile.title,
    department: profile.department,
    email: profile.email,
    phone: profile.phone,
    alternatePhone: profile.alternatePhone,
    preferredCommunicationMethod: profile.preferredCommunicationMethod,
    notes: profile.notes,
  };
}

export function OrganizationPortalProfilePage() {
  const { showError, showSuccess } = useToast();
  const [profile, setProfile] =
    useState<OrganizationPortalProfileRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await organizationPortalApi.getProfile();
        if (!cancelled) {
          setProfile(response);
        }
      } catch {
        if (!cancelled) {
          setError("The organization contact profile could not be loaded.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave() {
    if (!profile) {
      return;
    }
    setSaving(true);
    try {
      const response = await organizationPortalApi.updateProfile(
        toProfilePayload(profile),
      );
      setProfile(response);
      showSuccess("Organization contact profile updated.");
    } catch {
      showError("Organization contact profile could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingState />;
  }

  if (!profile) {
    return (
      <Alert severity="error">
        The organization contact profile is unavailable.
      </Alert>
    );
  }

  return (
    <Stack spacing={3}>
      <SectionHeader
        title="My Contact Profile"
        description="Update the organization contact record used for billing follow-up, service coordination, and tenant notifications."
      >
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Profile"}
        </Button>
      </SectionHeader>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <PageCard>
        <Stack spacing={3}>
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
            <TextField
              label="First name"
              value={profile.firstName}
              disabled
              fullWidth
            />
            <TextField
              label="Last name"
              value={profile.lastName}
              disabled
              fullWidth
            />
            <TextField
              label="Title"
              value={profile.title ?? ""}
              onChange={(event) =>
                setProfile({ ...profile, title: event.target.value || null })
              }
              fullWidth
            />
            <TextField
              label="Department"
              value={profile.department ?? ""}
              onChange={(event) =>
                setProfile({
                  ...profile,
                  department: event.target.value || null,
                })
              }
              fullWidth
            />
            <TextField
              label="Email"
              value={profile.email ?? ""}
              onChange={(event) =>
                setProfile({ ...profile, email: event.target.value || null })
              }
              fullWidth
            />
            <TextField
              label="Phone"
              value={profile.phone}
              onChange={(event) =>
                setProfile({ ...profile, phone: event.target.value })
              }
              fullWidth
            />
            <TextField
              label="Alternate phone"
              value={profile.alternatePhone ?? ""}
              onChange={(event) =>
                setProfile({
                  ...profile,
                  alternatePhone: event.target.value || null,
                })
              }
              fullWidth
            />
            <TextField
              select
              label="Preferred communication"
              value={profile.preferredCommunicationMethod ?? ""}
              onChange={(event) =>
                setProfile({
                  ...profile,
                  preferredCommunicationMethod:
                    (event.target.value as "PHONE" | "SMS" | "EMAIL" | "") ||
                    null,
                })
              }
              fullWidth
            >
              {communicationMethods.map((method) => (
                <MenuItem key={method || "default"} value={method}>
                  {method || "Not set"}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          <TextField
            label="Notes"
            value={profile.notes ?? ""}
            onChange={(event) =>
              setProfile({ ...profile, notes: event.target.value || null })
            }
            multiline
            minRows={3}
            fullWidth
          />
          <Alert severity="info">
            {profile.organizationName} • {profile.organizationStatus} • Primary
            contact:
            {profile.primaryContact ? " Yes" : " No"}
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Last updated {formatDateTime(profile.updatedAt)}
          </Typography>
        </Stack>
      </PageCard>
      <PageCard>
        <Stack spacing={1.5}>
          <SectionHeader
            eyebrow="Organization details"
            title="Organization Summary"
            description="Reference information attached to this organization portal account."
          />
          <Typography variant="body2" color="text.secondary">
            {profile.organizationCode} •{" "}
            {profile.legalName || profile.organizationName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Primary phone: {profile.primaryPhone || "-"} • Primary email:{" "}
            {profile.primaryEmail || "-"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Address: {profile.organizationAddress || "-"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Billing address: {profile.billingAddress || "-"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Website: {profile.website || "-"}
          </Typography>
        </Stack>
      </PageCard>
    </Stack>
  );
}
