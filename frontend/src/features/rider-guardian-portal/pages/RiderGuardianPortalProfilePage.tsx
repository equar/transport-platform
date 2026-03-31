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
  riderGuardianPortalApi,
  type RiderGuardianPortalProfilePayload,
  type RiderGuardianPortalProfileRecord,
} from "../api/riderGuardianPortalApi";

const communicationMethods = ["", "PHONE", "SMS", "EMAIL"] as const;

function toProfilePayload(
  profile: RiderGuardianPortalProfileRecord,
): RiderGuardianPortalProfilePayload {
  return {
    email: profile.email,
    phone: profile.phone,
    alternatePhone: profile.alternatePhone,
    addressLine1: profile.addressLine1,
    addressLine2: profile.addressLine2,
    city: profile.city,
    state: profile.state,
    zipCode: profile.zipCode,
    country: profile.country,
    defaultPickupAddress: profile.defaultPickupAddress,
    defaultDropoffAddress: profile.defaultDropoffAddress,
    pickupNotes: profile.pickupNotes,
    dropoffNotes: profile.dropoffNotes,
    specialInstructions: profile.specialInstructions,
    emergencyContactName: profile.emergencyContactName,
    emergencyContactPhone: profile.emergencyContactPhone,
    emergencyContactRelationship: profile.emergencyContactRelationship,
    preferredCommunicationMethod: profile.preferredCommunicationMethod,
    notes: profile.notes,
  };
}

export function RiderGuardianPortalProfilePage() {
  const { showError, showSuccess } = useToast();
  const [profile, setProfile] =
    useState<RiderGuardianPortalProfileRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await riderGuardianPortalApi.getProfile();
        if (!cancelled) {
          setProfile(response);
        }
      } catch {
        if (!cancelled) {
          setError("The portal profile could not be loaded.");
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
      const response = await riderGuardianPortalApi.updateProfile(
        toProfilePayload(profile),
      );
      setProfile(response);
      showSuccess("Portal profile updated.");
    } catch {
      showError("Portal profile could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingState />;
  }

  if (!profile) {
    return <Alert severity="error">The portal profile is unavailable.</Alert>;
  }

  const isGuardian = profile.scopeType === "GUARDIAN";

  return (
    <Stack spacing={3}>
      <SectionHeader
        title="My Profile"
        description="Keep rider or guardian contact details current so scheduling, support, and billing workflows stay aligned."
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
            {isGuardian ? (
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
            ) : (
              <TextField
                label="Rider code"
                value={profile.code ?? "-"}
                disabled
                fullWidth
              />
            )}
            <TextField
              label="Address line 1"
              value={profile.addressLine1 ?? ""}
              onChange={(event) =>
                setProfile({
                  ...profile,
                  addressLine1: event.target.value || null,
                })
              }
              fullWidth
            />
            <TextField
              label="Address line 2"
              value={profile.addressLine2 ?? ""}
              onChange={(event) =>
                setProfile({
                  ...profile,
                  addressLine2: event.target.value || null,
                })
              }
              fullWidth
            />
            <TextField
              label="City"
              value={profile.city ?? ""}
              onChange={(event) =>
                setProfile({ ...profile, city: event.target.value || null })
              }
              fullWidth
            />
            <TextField
              label="State"
              value={profile.state ?? ""}
              onChange={(event) =>
                setProfile({ ...profile, state: event.target.value || null })
              }
              fullWidth
            />
            <TextField
              label="ZIP code"
              value={profile.zipCode ?? ""}
              onChange={(event) =>
                setProfile({ ...profile, zipCode: event.target.value || null })
              }
              fullWidth
            />
            <TextField
              label="Country"
              value={profile.country ?? ""}
              onChange={(event) =>
                setProfile({ ...profile, country: event.target.value || null })
              }
              fullWidth
            />
          </Box>
          {!isGuardian ? (
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
                label="Default pickup address"
                value={profile.defaultPickupAddress ?? ""}
                onChange={(event) =>
                  setProfile({
                    ...profile,
                    defaultPickupAddress: event.target.value || null,
                  })
                }
                fullWidth
              />
              <TextField
                label="Default dropoff address"
                value={profile.defaultDropoffAddress ?? ""}
                onChange={(event) =>
                  setProfile({
                    ...profile,
                    defaultDropoffAddress: event.target.value || null,
                  })
                }
                fullWidth
              />
              <TextField
                label="Emergency contact name"
                value={profile.emergencyContactName ?? ""}
                onChange={(event) =>
                  setProfile({
                    ...profile,
                    emergencyContactName: event.target.value || null,
                  })
                }
                fullWidth
              />
              <TextField
                label="Emergency contact phone"
                value={profile.emergencyContactPhone ?? ""}
                onChange={(event) =>
                  setProfile({
                    ...profile,
                    emergencyContactPhone: event.target.value || null,
                  })
                }
                fullWidth
              />
              <TextField
                label="Emergency relationship"
                value={profile.emergencyContactRelationship ?? ""}
                onChange={(event) =>
                  setProfile({
                    ...profile,
                    emergencyContactRelationship: event.target.value || null,
                  })
                }
                fullWidth
              />
              <TextField
                label="Special instructions"
                value={profile.specialInstructions ?? ""}
                onChange={(event) =>
                  setProfile({
                    ...profile,
                    specialInstructions: event.target.value || null,
                  })
                }
                multiline
                minRows={3}
                fullWidth
              />
            </Box>
          ) : null}
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
          <Typography variant="body2" color="text.secondary">
            Status: {profile.status} • Last updated{" "}
            {formatDateTime(profile.updatedAt)}
          </Typography>
        </Stack>
      </PageCard>
    </Stack>
  );
}
