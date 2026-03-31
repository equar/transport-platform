import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
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
  organizationPortalApi,
  type OrganizationPortalContactRecord,
  type OrganizationPortalContractRecord,
  type OrganizationPortalDashboardRecord,
  type OrganizationPortalInvoiceRecord,
  type OrganizationPortalPaymentRecord,
  type OrganizationPortalProfilePayload,
  type OrganizationPortalProfileRecord,
  type OrganizationPortalRideRecord,
  type OrganizationPortalRiderRecord,
} from "../api/organizationPortalApi";

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

export function OrganizationPortalHomePage() {
  const { showError, showSuccess } = useToast();
  const [dashboard, setDashboard] =
    useState<OrganizationPortalDashboardRecord | null>(null);
  const [profile, setProfile] =
    useState<OrganizationPortalProfileRecord | null>(null);
  const [contacts, setContacts] = useState<OrganizationPortalContactRecord[]>(
    [],
  );
  const [riders, setRiders] = useState<OrganizationPortalRiderRecord[]>([]);
  const [rides, setRides] = useState<OrganizationPortalRideRecord[]>([]);
  const [contracts, setContracts] = useState<
    OrganizationPortalContractRecord[]
  >([]);
  const [invoices, setInvoices] = useState<OrganizationPortalInvoiceRecord[]>(
    [],
  );
  const [payments, setPayments] = useState<OrganizationPortalPaymentRecord[]>(
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
        contactsResponse,
        ridersResponse,
        ridesResponse,
        contractsResponse,
        invoicesResponse,
        paymentsResponse,
      ] = await Promise.all([
        organizationPortalApi.getDashboard(),
        organizationPortalApi.getProfile(),
        organizationPortalApi.getContacts(),
        organizationPortalApi.searchRiders({
          size: 5,
          sortBy: "lastName",
          sortDirection: "ASC",
        }),
        organizationPortalApi.searchRides({
          size: 5,
          sortBy: "scheduledPickupAt",
          sortDirection: "ASC",
        }),
        organizationPortalApi.searchContracts({
          size: 5,
          sortBy: "updatedAt",
          sortDirection: "DESC",
        }),
        organizationPortalApi.searchInvoices({
          size: 5,
          sortBy: "invoiceDate",
          sortDirection: "DESC",
        }),
        organizationPortalApi.searchPayments({
          size: 5,
          sortBy: "paymentDate",
          sortDirection: "DESC",
        }),
      ]);
      setDashboard(dashboardResponse);
      setProfile(profileResponse);
      setContacts(contactsResponse);
      setRiders(ridersResponse.items);
      setRides(ridesResponse.items);
      setContracts(contractsResponse.items);
      setInvoices(invoicesResponse.items);
      setPayments(paymentsResponse.items);
    } catch {
      setError("The organization portal could not be loaded.");
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
      const updatedProfile = await organizationPortalApi.updateProfile(
        toProfilePayload(profile),
      );
      setProfile(updatedProfile);
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

  return (
    <Stack spacing={3}>
      <SectionHeader
        title="Organization Portal"
        description="Scoped organization visibility for contact self-service, rider roster, ride activity, contracts, and billing."
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
              icon={<BadgeRoundedIcon color="primary" />}
              label="Linked Riders"
              value={dashboard.linkedRiderCount}
            />
          </Box>
          <Box>
            <MetricCard
              icon={<ReceiptLongRoundedIcon color="primary" />}
              label="Active Contracts"
              value={dashboard.activeContractCount}
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
              eyebrow="Organization contact"
              title="My Contact Profile"
              description="Maintain the organization contact record used for tenant notifications, billing follow-up, and operational coordination."
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
              {profile.organizationName} • {profile.organizationStatus} •
              Primary contact:
              {profile.primaryContact ? " Yes" : " No"}
            </Alert>
            <Typography variant="body2" color="text.secondary">
              Last updated {formatDateTime(profile.updatedAt)}
            </Typography>
          </Stack>
        </PageCard>
      ) : null}
      {profile ? (
        <PageCard>
          <Stack spacing={1.5}>
            <SectionHeader
              eyebrow="Organization details"
              title="Organization Summary"
              description="Core organization information currently attached to this portal contact."
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
      ) : null}
      <PageCard sx={{ p: 0, overflow: "hidden" }}>
        <Stack spacing={2} sx={{ p: { xs: 3, md: 4 } }}>
          <SectionHeader
            eyebrow="Contacts"
            title="Organization Contacts"
            description="Current contact roster available to the organization portal."
          />
        </Stack>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contacts.map((contact) => (
              <TableRow key={contact.id} hover>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography fontWeight={700}>
                      {contact.firstName} {contact.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {contact.primary
                        ? "Primary contact"
                        : "Secondary contact"}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  {contact.title || contact.department || "-"}
                </TableCell>
                <TableCell>{contact.email || "-"}</TableCell>
                <TableCell>{contact.phone}</TableCell>
                <TableCell>
                  <StatusChip value={contact.status} />
                </TableCell>
              </TableRow>
            ))}
            {contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography color="text.secondary">
                    No contacts are currently visible.
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
              eyebrow="Roster"
              title="Linked Riders"
              description="The most recent rider records tied to this organization."
            />
          </Stack>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Rider</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Support needs</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {riders.map((rider) => (
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
                  <TableCell>{rider.riderType}</TableCell>
                  <TableCell>
                    <StatusChip value={rider.status} />
                  </TableCell>
                  <TableCell>
                    {rider.wheelchairRequired || rider.escortRequired
                      ? `${rider.wheelchairRequired ? "Wheelchair" : ""}${
                          rider.wheelchairRequired && rider.escortRequired
                            ? " • "
                            : ""
                        }${rider.escortRequired ? "Escort" : ""}`
                      : "Standard"}
                  </TableCell>
                </TableRow>
              ))}
              {riders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography color="text.secondary">
                      No linked riders are currently visible.
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
              eyebrow="Service"
              title="Upcoming Rides"
              description="The latest ride activity tied to this organization’s scoped records."
            />
          </Stack>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Ride</TableCell>
                <TableCell>Pickup</TableCell>
                <TableCell>Rider</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rides.map((ride) => (
                <TableRow key={ride.id} hover>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography fontWeight={700}>
                        {ride.rideNumber}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {ride.pickupAddress || "Pickup address pending"}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {formatDateTime(ride.scheduledPickupAt)}
                  </TableCell>
                  <TableCell>{ride.riderName}</TableCell>
                  <TableCell>
                    <StatusChip value={ride.status} />
                  </TableCell>
                </TableRow>
              ))}
              {rides.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography color="text.secondary">
                      No ride activity is currently visible.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </PageCard>
      </Box>
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
              eyebrow="Contracts"
              title="Current Agreements"
              description="Recent contracts visible to this organization portal user."
            />
          </Stack>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Contract</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Billing</TableCell>
                <TableCell>Dates</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contracts.map((contract) => (
                <TableRow key={contract.id} hover>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography fontWeight={700}>
                        {contract.contractName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {contract.contractCode}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{contract.contractType}</TableCell>
                  <TableCell>{contract.billingModel}</TableCell>
                  <TableCell>
                    {formatDate(contract.startDate)} -{" "}
                    {formatDate(contract.endDate)}
                  </TableCell>
                  <TableCell>
                    <StatusChip value={contract.status} />
                  </TableCell>
                </TableRow>
              ))}
              {contracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography color="text.secondary">
                      No contracts are currently visible.
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
              title="Invoices"
              description="Recent invoice activity for the organization scope."
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
      </Box>
      <PageCard sx={{ p: 0, overflow: "hidden" }}>
        <Stack spacing={2} sx={{ p: { xs: 3, md: 4 } }}>
          <SectionHeader
            eyebrow="Billing"
            title="Payments"
            description="Recent payment entries already posted against this organization’s invoices."
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
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id} hover>
                <TableCell>{payment.paymentNumber}</TableCell>
                <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                <TableCell>{payment.invoiceNumber || "-"}</TableCell>
                <TableCell>{payment.paymentMethod || "-"}</TableCell>
                <TableCell>{formatAmount(payment.amount)}</TableCell>
                <TableCell>
                  <StatusChip value={payment.status} />
                </TableCell>
              </TableRow>
            ))}
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography color="text.secondary">
                    No payments are currently visible.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </PageCard>
    </Stack>
  );
}
