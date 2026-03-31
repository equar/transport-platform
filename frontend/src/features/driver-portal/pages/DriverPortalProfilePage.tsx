import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import { Alert, Button, Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import {
  driverPortalApi,
  type DriverPortalProfilePayload,
  type DriverPortalProfileRecord,
} from "../api/driverPortalApi";
import { LoadingState } from "../../../shared/components/LoadingState";
import { PageCard } from "../../../shared/components/PageCard";
import { SectionHeader } from "../../../shared/components/SectionHeader";
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
    <Stack spacing={3}>
      <SectionHeader
        title="My Profile"
        description="Manage your self-service contact and emergency information without leaving the portal."
      />
      {error ? <Alert severity="error">{error}</Alert> : null}
      {profile ? (
        <PageCard>
          <Stack spacing={2}>
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
            <TextField
              label="City"
              value={form.city ?? ""}
              onChange={(event) =>
                setForm((current) => ({ ...current, city: event.target.value }))
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
              minRows={4}
              fullWidth
            />
            <Stack direction="row" justifyContent="flex-end">
              <Button
                startIcon={<SaveRoundedIcon />}
                variant="contained"
                onClick={handleSave}
                disabled={saving}
              >
                Save Profile
              </Button>
            </Stack>
          </Stack>
        </PageCard>
      ) : null}
    </Stack>
  );
}
