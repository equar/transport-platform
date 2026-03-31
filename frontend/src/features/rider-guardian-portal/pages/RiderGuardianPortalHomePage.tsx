import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { LoadingState } from "../../../shared/components/LoadingState";
import { MetricCard } from "../../../shared/components/MetricCard";
import { PageCard } from "../../../shared/components/PageCard";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { StatusChip } from "../../../shared/components/StatusChip";
import { useToast } from "../../../shared/providers/ToastProvider";
import { formatDateTime } from "../../../shared/utils/format";
import {
  riderGuardianPortalApi,
  type RiderGuardianPortalDashboardRecord,
  type RiderGuardianPortalInvoiceRecord,
  type RiderGuardianPortalLinkedRiderRecord,
  type RiderGuardianPortalPaymentRecord,
  type RiderGuardianPortalProfilePayload,
  type RiderGuardianPortalProfileRecord,
  type RiderGuardianPortalRideRecord,
} from "../api/riderGuardianPortalApi";

const communicationMethods = ["", "PHONE", "SMS", "EMAIL"] as const;

function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value ?? 0);
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value ?? 0);
}

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

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

export function RiderGuardianPortalHomePage() {
  const { showError, showSuccess } = useToast();
  const [dashboard, setDashboard] =
    useState<RiderGuardianPortalDashboardRecord | null>(null);
  const [profile, setProfile] =
    useState<RiderGuardianPortalProfileRecord | null>(null);
  const [linkedRiders, setLinkedRiders] = useState<
    RiderGuardianPortalLinkedRiderRecord[]
  >([]);
  const [rides, setRides] = useState<RiderGuardianPortalRideRecord[]>([]);
  const [invoices, setInvoices] = useState<RiderGuardianPortalInvoiceRecord[]>(
    [],
  );
  const [payments, setPayments] = useState<RiderGuardianPortalPaymentRecord[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadPortal() {
    setLoading(true);
    setError(null);
    try {
      const [
        dashboardResponse,
        profileResponse,
        ridersResponse,
        ridesResponse,
        invoicesResponse,
        paymentsResponse,
      ] = await Promise.all([
        riderGuardianPortalApi.getDashboard(),
        riderGuardianPortalApi.getProfile(),
        riderGuardianPortalApi.getLinkedRiders(),
        riderGuardianPortalApi.searchRides({
          size: 5,
          sortBy: "scheduledPickupAt",
          sortDirection: "ASC",
        }),
        riderGuardianPortalApi.searchInvoices({
          size: 5,
          sortBy: "invoiceDate",
          sortDirection: "DESC",
        }),
        riderGuardianPortalApi.searchPayments({
          size: 5,
          sortBy: "paymentDate",
          sortDirection: "DESC",
        }),
      ]);
      setDashboard(dashboardResponse);
      setProfile(profileResponse);
      setLinkedRiders(ridersResponse);
      setRides(ridesResponse.items);
      setInvoices(invoicesResponse.items);
      setPayments(paymentsResponse.items);
    } catch {
      setError("The rider or guardian portal could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPortal();
  }, []);

  async function handleProfileSave() {
    if (!profile) {
      return;
    }
    setSaving(true);
    try {
      const updatedProfile = await riderGuardianPortalApi.updateProfile(
        toProfilePayload(profile),
      );
      setProfile(updatedProfile);
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

  const scopeLabel = dashboard?.scopeType === "GUARDIAN" ? "Guardian" : "Rider";
  const isGuardian = profile?.scopeType === "GUARDIAN";

  return (
    <Stack spacing={3}>
      <SectionHeader
        title="Rider And Guardian Portal"
        description="Scoped self-service access for profile maintenance, linked riders, ride visibility, and billing activity."
      />
      {error ? <Alert severity="error">{error}</Alert> : null}
      {dashboard ? (
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(3, minmax(0, 1fr))",
              xl: "repeat(6, minmax(0, 1fr))",
            },
          }}
        >
          <Box>
            <MetricCard
              icon={<PeopleAltRoundedIcon color="primary" />}
              label="Linked Riders"
              value={dashboard.linkedRiderCount}
              caption={`${scopeLabel} scope`}
            />
          </Box>
          <Box>
            <MetricCard
              icon={<CalendarMonthRoundedIcon color="primary" />}
              label="Upcoming Rides"
              value={dashboard.upcomingRideCount}
            />
          </Box>
          <Box>
            <MetricCard
              icon={<CalendarMonthRoundedIcon color="primary" />}
              label="Active Ride Queue"
              value={dashboard.activeRideCount}
            />
          </Box>
          <Box>
            <MetricCard
              icon={<AttachMoneyRoundedIcon color="primary" />}
              label="Open Invoices"
              value={dashboard.openInvoiceCount}
            />
          </Box>
          <Box>
            <MetricCard
              icon={<AttachMoneyRoundedIcon color="primary" />}
              label="Outstanding Balance"
              value={formatCurrency(dashboard.outstandingBalance)}
            />
          </Box>
          <Box>
            <MetricCard
              icon={<NotificationsRoundedIcon color="primary" />}
              label="Unread Alerts"
              value={dashboard.unreadNotifications}
            />
          </Box>
        </Box>
      ) : null}
      {profile ? (
        <PageCard>
          <Stack spacing={3}>
            <SectionHeader
              eyebrow={`${scopeLabel} self-service`}
              title="My Profile"
              description="Keep contact information current so dispatch, billing, and support teams can reach the right person."
            >
              <Button
                variant="contained"
                onClick={handleProfileSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </SectionHeader>
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
                        (event.target.value as
                          | "PHONE"
                          | "SMS"
                          | "EMAIL"
                          | "") || null,
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
                  setProfile({
                    ...profile,
                    zipCode: event.target.value || null,
                  })
                }
                fullWidth
              />
              <TextField
                label="Country"
                value={profile.country ?? ""}
                onChange={(event) =>
                  setProfile({
                    ...profile,
                    country: event.target.value || null,
                  })
                }
                fullWidth
              />
              {!isGuardian ? (
                <>
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
                </>
              ) : null}
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
                  label="Pickup notes"
                  value={profile.pickupNotes ?? ""}
                  onChange={(event) =>
                    setProfile({
                      ...profile,
                      pickupNotes: event.target.value || null,
                    })
                  }
                  multiline
                  minRows={3}
                  fullWidth
                />
                <TextField
                  label="Dropoff notes"
                  value={profile.dropoffNotes ?? ""}
                  onChange={(event) =>
                    setProfile({
                      ...profile,
                      dropoffNotes: event.target.value || null,
                    })
                  }
                  multiline
                  minRows={3}
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
                <TextField
                  label="Emergency contact relationship"
                  value={profile.emergencyContactRelationship ?? ""}
                  onChange={(event) =>
                    setProfile({
                      ...profile,
                      emergencyContactRelationship: event.target.value || null,
                    })
                  }
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
      ) : null}
      <PageCard sx={{ p: 0, overflow: "hidden" }}>
        <Stack spacing={2} sx={{ p: { xs: 3, md: 4 } }}>
          <SectionHeader
            eyebrow="Rider visibility"
            title="Linked Riders"
            description="Family and rider relationships currently available to this portal scope."
          />
        </Stack>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Rider</TableCell>
              <TableCell>Relationship</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Pickup</TableCell>
              <TableCell>Billing</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {linkedRiders.map((rider) => (
              <TableRow key={rider.id} hover>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography fontWeight={700}>
                      {rider.riderDisplayName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {rider.riderCode}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>{rider.relationshipType ?? "Self"}</TableCell>
                <TableCell>
                  <StatusChip value={rider.status} />
                </TableCell>
                <TableCell>
                  {rider.authorizedForPickup ? "Authorized" : "No"}
                </TableCell>
                <TableCell>{rider.billingContact ? "Visible" : "No"}</TableCell>
              </TableRow>
            ))}
            {linkedRiders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography color="text.secondary">
                    No linked riders are available.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </PageCard>
      <PageCard sx={{ p: 0, overflow: "hidden" }}>
        <Stack spacing={2} sx={{ p: { xs: 3, md: 4 } }}>
          <SectionHeader
            eyebrow="Ride activity"
            title="Upcoming And Recent Rides"
            description="The most recent scoped rides visible to this rider or guardian portal account."
          />
        </Stack>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Ride</TableCell>
              <TableCell>Pickup</TableCell>
              <TableCell>Rider</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Organization</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rides.map((ride) => (
              <TableRow key={ride.id} hover>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography fontWeight={700}>{ride.rideNumber}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {ride.pickupAddress ?? "Pickup address pending"}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>{formatDateTime(ride.scheduledPickupAt)}</TableCell>
                <TableCell>{ride.riderName}</TableCell>
                <TableCell>
                  <StatusChip value={ride.status} />
                </TableCell>
                <TableCell>{ride.organizationName ?? "-"}</TableCell>
              </TableRow>
            ))}
            {rides.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography color="text.secondary">
                    No rides are available for this portal scope.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </PageCard>
      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", xl: "repeat(2, minmax(0, 1fr))" },
        }}
      >
        <PageCard sx={{ p: 0, overflow: "hidden" }}>
          <Stack spacing={2} sx={{ p: { xs: 3, md: 4 } }}>
            <SectionHeader
              eyebrow="Billing"
              title="Invoices"
              description="Recent invoices and open balances for the current portal scope."
            />
          </Stack>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Invoice</TableCell>
                <TableCell>Invoice date</TableCell>
                <TableCell>Due</TableCell>
                <TableCell>Balance</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id} hover>
                  <TableCell>{invoice.invoiceNumber}</TableCell>
                  <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                  <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                  <TableCell>
                    {formatCurrency(invoice.balanceDue, invoice.currency)}
                  </TableCell>
                  <TableCell>
                    <StatusChip value={invoice.status} />
                  </TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography color="text.secondary">
                      No invoices are currently visible.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </PageCard>
        <PageCard sx={{ p: 0, overflow: "hidden" }}>
          <Stack spacing={2} sx={{ p: { xs: 3, md: 4 } }}>
            <SectionHeader
              eyebrow="Billing"
              title="Payments"
              description="Recent payment activity already applied within the scoped billing history."
            />
          </Stack>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Payment</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Invoice</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id} hover>
                  <TableCell>{payment.paymentNumber}</TableCell>
                  <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                  <TableCell>{payment.invoiceNumber ?? "-"}</TableCell>
                  <TableCell>{payment.paymentMethod ?? "-"}</TableCell>
                  <TableCell>{formatAmount(payment.amount)}</TableCell>
                </TableRow>
              ))}
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography color="text.secondary">
                      No payments are currently visible.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </PageCard>
      </Box>
    </Stack>
  );
}
