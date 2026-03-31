import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import {
  Alert,
  Box,
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
import {
  organizationPortalApi,
  type OrganizationPortalContactRecord,
  type OrganizationPortalDashboardRecord,
  type OrganizationPortalRiderRecord,
} from "../api/organizationPortalApi";

const riderStatuses = [
  "",
  "PENDING",
  "ACTIVE",
  "SUSPENDED",
  "INACTIVE",
  "WAITLISTED",
] as const;

export function OrganizationPortalRosterPage() {
  const [dashboard, setDashboard] =
    useState<OrganizationPortalDashboardRecord | null>(null);
  const [contacts, setContacts] = useState<OrganizationPortalContactRecord[]>(
    [],
  );
  const [riders, setRiders] = useState<OrganizationPortalRiderRecord[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [dashboardResponse, contactsResponse, ridersResponse] =
          await Promise.all([
            organizationPortalApi.getDashboard(),
            organizationPortalApi.getContacts(),
            organizationPortalApi.searchRiders({
              status: status || undefined,
              size: 25,
              sortBy: "lastName",
              sortDirection: "ASC",
            }),
          ]);
        if (!cancelled) {
          setDashboard(dashboardResponse);
          setContacts(contactsResponse);
          setRiders(ridersResponse.items);
        }
      } catch {
        if (!cancelled) {
          setError("The organization roster could not be loaded.");
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
  }, [status]);

  if (loading) {
    return <LoadingState />;
  }

  return (
    <Stack spacing={3}>
      <SectionHeader
        title="Roster"
        description="Review organization contacts and linked riders within the current portal scope."
      />
      {error ? <Alert severity="error">{error}</Alert> : null}
      {dashboard ? (
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
          }}
        >
          <Box>
            <MetricCard
              icon={<BadgeRoundedIcon color="primary" />}
              label="Organization Contacts"
              value={contacts.length}
            />
          </Box>
          <Box>
            <MetricCard
              icon={<GroupsRoundedIcon color="primary" />}
              label="Linked Riders"
              value={dashboard.linkedRiderCount}
            />
          </Box>
        </Box>
      ) : null}
      <PageCard>
        <TextField
          select
          label="Rider status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          sx={{ minWidth: { md: 220 } }}
        >
          {riderStatuses.map((option) => (
            <MenuItem key={option || "all-statuses"} value={option}>
              {option || "All rider statuses"}
            </MenuItem>
          ))}
        </TextField>
      </PageCard>
      <PageCard sx={{ p: 0, overflow: "hidden" }}>
        <Stack spacing={2} sx={{ p: { xs: 3, md: 4 } }}>
          <SectionHeader
            eyebrow="Contacts"
            title="Organization Contacts"
            description="Current contact roster visible to the organization portal."
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
          </TableBody>
        </Table>
      </PageCard>
      <PageCard sx={{ p: 0, overflow: "hidden" }}>
        <Stack spacing={2} sx={{ p: { xs: 3, md: 4 } }}>
          <SectionHeader
            eyebrow="Riders"
            title="Linked Riders"
            description="The riders currently tied to this organization."
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
                    No riders match the current filter.
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
