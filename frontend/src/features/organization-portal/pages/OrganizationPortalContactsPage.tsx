import ContactsRoundedIcon from "@mui/icons-material/ContactsRounded";
import MarkEmailReadRoundedIcon from "@mui/icons-material/MarkEmailReadRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import { Alert, Box, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { LoadingState } from "../../../shared/components/LoadingState";
import { MetricCard } from "../../../shared/components/MetricCard";
import { PageCard } from "../../../shared/components/PageCard";
import { formatDateTime } from "../../../shared/utils/format";
import {
  organizationPortalApi,
  type OrganizationPortalContactRecord,
} from "../api/organizationPortalApi";

export function OrganizationPortalContactsPage() {
  const [contacts, setContacts] = useState<OrganizationPortalContactRecord[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await organizationPortalApi.getContacts();
        if (!cancelled) {
          setContacts(response);
        }
      } catch {
        if (!cancelled) {
          setError("Organization contacts could not be loaded.");
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

  const primaryCount = contacts.filter((contact) => contact.primary).length;

  return (
    <Stack spacing={2.5}>
      <PageCard>
        <Stack spacing={1}>
          <Typography variant="h4">Contacts</Typography>
          <Typography color="text.secondary">
            Review the business contacts already visible to your organization
            account. Editing stays limited to your own profile page.
          </Typography>
        </Stack>
      </PageCard>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
        }}
      >
        <Box>
          <MetricCard
            icon={<ContactsRoundedIcon color="primary" />}
            label="Visible Contacts"
            value={contacts.length}
          />
        </Box>
        <Box>
          <MetricCard
            icon={<MarkEmailReadRoundedIcon color="primary" />}
            label="Primary Contacts"
            value={primaryCount}
          />
        </Box>
        <Box>
          <MetricCard
            icon={<PhoneRoundedIcon color="primary" />}
            label="With Phone"
            value={contacts.filter((contact) => Boolean(contact.phone)).length}
          />
        </Box>
      </Box>
      <Stack spacing={2}>
        {contacts.length === 0 ? (
          <PageCard>
            <Typography color="text.secondary">
              No organization contacts are visible right now.
            </Typography>
          </PageCard>
        ) : (
          contacts.map((contact) => (
            <PageCard key={contact.id}>
              <Stack spacing={1.1}>
                <Typography variant="h6">
                  {contact.firstName} {contact.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {contact.title ||
                    contact.department ||
                    "Organization contact"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Email: {contact.email || "-"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Phone: {contact.phone || "-"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Communication:{" "}
                  {contact.preferredCommunicationMethod || "Not set"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Status: {contact.status.replaceAll("_", " ")}
                  {contact.primary ? " • Primary contact" : ""}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Last updated {formatDateTime(contact.updatedAt)}
                </Typography>
              </Stack>
            </PageCard>
          ))
        )}
      </Stack>
    </Stack>
  );
}
