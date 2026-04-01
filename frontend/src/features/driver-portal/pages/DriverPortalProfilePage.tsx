import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import {
  driverPortalApi,
  type DriverPortalProfilePayload,
  type DriverPortalProfileRecord,
} from "../api/driverPortalApi";
import { LoadingState } from "../../../shared/components/LoadingState";
import { PageCard } from "../../../shared/components/PageCard";
import { useToast } from "../../../shared/providers/ToastProvider";

export function DriverPortalProfilePage() {
  const { showError, showSuccess } = useToast();
  const [profile, setProfile] = useState<DriverPortalProfileRecord | null>(
    null,
  );
  const [form, setForm] = useState<DriverPortalProfilePayload>({ phone: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await driverPortalApi.getProfile();
        if (!cancelled) {
          setProfile(response);
          setForm({
            phone: response.phone,
            alternatePhone: response.alternatePhone,
            addressLine1: response.addressLine1,
            addressLine2: response.addressLine2,
            city: response.city,
            state: response.state,
            zipCode: response.zipCode,
            country: response.country,
            availabilitySummary: response.availabilitySummary,
            emergencyContactName: response.emergencyContactName,
            emergencyContactPhone: response.emergencyContactPhone,
            emergencyContactRelationship: response.emergencyContactRelationship,
            notes: response.notes,
          });
        }
      } catch {
        if (!cancelled) {
          setError("Driver profile could not be loaded.");
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

  if (loading) {
    return <LoadingState />;
  }

  async function handleSave() {
    setSaving(true);
    try {
      const response = await driverPortalApi.updateProfile(form);
      setProfile(response);
      showSuccess("Driver profile updated.");
    } catch {
      showError("Driver profile could not be updated.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Stack spacing={2.5}>
      <PageCard>
        <Stack spacing={1}>
          <Typography variant="h4">My Profile</Typography>
          <Typography color="text.secondary">
            Keep your contact information, availability, and emergency details
            current for dispatch and support teams.
          </Typography>
        </Stack>
      </PageCard>
      {error ? <Alert severity="error">{error}</Alert> : null}
      {profile ? (
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "1fr",
              lg: "minmax(0, 0.9fr) minmax(0, 1.1fr)",
            },
          }}
        >
          <PageCard>
            <Stack spacing={2}>
              <Typography variant="h5">Driver identity</Typography>
              <Typography color="text.secondary">
                These details come from your account and help dispatch confirm
                your assignment and contact profile.
              </Typography>
              <TextField
                label="Driver Code"
                value={profile.driverCode}
                disabled
                fullWidth
              />
              <TextField
                label="Full Name"
                value={`${profile.firstName} ${profile.lastName}`}
                disabled
                fullWidth
              />
              <TextField
                label="Email"
                value={profile.email ?? ""}
                disabled
                fullWidth
              />
              <Stack spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  License expiry: {profile.licenseExpiryDate ?? "Not available"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Background check expiry:{" "}
                  {profile.backgroundCheckExpiryDate ?? "Not available"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Drug test expiry:{" "}
                  {profile.drugTestExpiryDate ?? "Not available"}
                </Typography>
              </Stack>
            </Stack>
          </PageCard>
          <PageCard>
            <Stack spacing={2}>
              <Typography variant="h5">Update my details</Typography>
              <Typography color="text.secondary">
                Keep this information current so operations can reach you and
                support your route changes quickly.
              </Typography>
              <TextField
                label="Phone"
                value={form.phone ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
                fullWidth
              />
              <TextField
                label="Alternate Phone"
                value={form.alternatePhone ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    alternatePhone: event.target.value,
                  }))
                }
                fullWidth
              />
              <TextField
                label="Availability Summary"
                value={form.availabilitySummary ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    availabilitySummary: event.target.value,
                  }))
                }
                fullWidth
              />
              <TextField
                label="Address Line 1"
                value={form.addressLine1 ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    addressLine1: event.target.value,
                  }))
                }
                fullWidth
              />
              <TextField
                label="Address Line 2"
                value={form.addressLine2 ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    addressLine2: event.target.value,
                  }))
                }
                fullWidth
              />
              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                  },
                }}
              >
                <TextField
                  label="City"
                  value={form.city ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      city: event.target.value,
                    }))
                  }
                  fullWidth
                />
                <TextField
                  label="State"
                  value={form.state ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      state: event.target.value,
                    }))
                  }
                  fullWidth
                />
                <TextField
                  label="ZIP Code"
                  value={form.zipCode ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      zipCode: event.target.value,
                    }))
                  }
                  fullWidth
                />
                <TextField
                  label="Country"
                  value={form.country ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      country: event.target.value,
                    }))
                  }
                  fullWidth
                />
              </Box>
              <Typography variant="subtitle2">Emergency contact</Typography>
              <TextField
                label="Emergency Contact Name"
                value={form.emergencyContactName ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    emergencyContactName: event.target.value,
                  }))
                }
                fullWidth
              />
              <TextField
                label="Emergency Contact Phone"
                value={form.emergencyContactPhone ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    emergencyContactPhone: event.target.value,
                  }))
                }
                fullWidth
              />
              <TextField
                label="Emergency Contact Relationship"
                value={form.emergencyContactRelationship ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    emergencyContactRelationship: event.target.value,
                  }))
                }
                fullWidth
              />
              <TextField
                label="Notes"
                value={form.notes ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                multiline
                minRows={3}
                fullWidth
              />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button
                  startIcon={<SaveRoundedIcon />}
                  variant="contained"
                  onClick={handleSave}
                  disabled={saving}
                >
                  Save profile
                </Button>
                <Button
                  startIcon={<PhoneRoundedIcon />}
                  variant="outlined"
                  disabled
                >
                  Contact dispatch from company channels
                </Button>
              </Stack>
            </Stack>
          </PageCard>
        </Box>
      ) : null}
    </Stack>
  );
}
