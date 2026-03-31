import {
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { StatusChip } from "../../../shared/components/StatusChip";
import { formatDateTime } from "../../../shared/utils/format";
import type { CompanyApplication } from "../api/companyApplicationsApi";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography>{value}</Typography>
    </Stack>
  );
}

interface CompanyApplicationDetailsDialogProps {
  open: boolean;
  application: CompanyApplication | null;
  onClose: () => void;
}

export function CompanyApplicationDetailsDialog({
  open,
  application,
  onClose,
}: CompanyApplicationDetailsDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Application Details</DialogTitle>
      <DialogContent>
        {application ? (
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              justifyContent="space-between"
            >
              <Stack spacing={0.5}>
                <Typography variant="h5">
                  {application.legalCompanyName}
                </Typography>
                <Typography color="text.secondary">
                  {application.applicationNumber}
                </Typography>
              </Stack>
              <StatusChip value={application.status} />
            </Stack>
            <Divider />
            <DetailRow label="DBA Name" value={application.dbaName || "-"} />
            <DetailRow
              label="Primary Contact"
              value={`${application.contactFirstName} ${application.contactLastName}`}
            />
            <DetailRow label="Email" value={application.email} />
            <DetailRow label="Phone" value={application.phone} />
            <DetailRow label="Business Type" value={application.businessType} />
            <DetailRow
              label="Requested Service Types"
              value={application.requestedServiceTypes.join(", ")}
            />
            <DetailRow
              label="Fleet Size"
              value={String(application.fleetSize ?? 0)}
            />
            <DetailRow
              label="Number of Drivers"
              value={String(application.numberOfDrivers ?? 0)}
            />
            <DetailRow
              label="Address"
              value={[
                application.addressLine1,
                application.addressLine2,
                application.city,
                application.state,
                application.zipCode,
                application.country,
              ]
                .filter(Boolean)
                .join(", ")}
            />
            <DetailRow label="Notes" value={application.notes || "-"} />
            <DetailRow
              label="Review Notes"
              value={application.reviewNotes || "-"}
            />
            <DetailRow
              label="Rejection Reason"
              value={application.rejectionReason || "-"}
            />
            <DetailRow
              label="Created"
              value={`${application.createdBy} • ${formatDateTime(application.createdAt)}`}
            />
            <DetailRow
              label="Updated"
              value={`${application.updatedBy} • ${formatDateTime(application.updatedAt)}`}
            />
            <Divider />
            <Stack spacing={1}>
              <Typography variant="h6">Review Activity</Typography>
              {application.reviewEvents.map((event) => (
                <Stack
                  key={event.id}
                  spacing={0.25}
                  sx={{
                    py: 1.25,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography sx={{ fontWeight: 700 }}>
                    {event.action.replaceAll("_", " ")}
                  </Typography>
                  <Typography color="text.secondary">
                    {event.createdBy} • {formatDateTime(event.createdAt)}
                  </Typography>
                  <Typography color="text.secondary">
                    {event.notes || "No notes recorded."}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Stack>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
