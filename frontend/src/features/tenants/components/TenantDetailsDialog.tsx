import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import PersonAddRoundedIcon from "@mui/icons-material/PersonAddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Link as RouterLink } from "react-router-dom";
import type { Tenant } from "../api/tenantsApi";
import { StatusChip } from "../../../shared/components/StatusChip";
import { formatDateTime } from "../../../shared/utils/format";

interface TenantDetailsDialogProps {
  open: boolean;
  tenant: Tenant | null;
  onClose: () => void;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1">{value}</Typography>
    </Stack>
  );
}

export function TenantDetailsDialog({
  open,
  tenant,
  onClose,
}: TenantDetailsDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
        Tenant Details
        <IconButton aria-label="Close tenant details" onClick={onClose} size="small">
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {tenant ? (
          <Stack spacing={3} sx={{ mt: 1 }}>
            {tenant.status === "PENDING" ? (
              <Alert severity="info">
                Before activation, create a tenant administrator account for this
                tenant. Activation initializes access to the company workspace;
                pending tenants cannot sign in.
              </Alert>
            ) : tenant.status === "SUSPENDED" ? (
              <Alert severity="warning">
                Sign-in and tenant resources are blocked while this tenant is suspended.
              </Alert>
            ) : null}
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              justifyContent="space-between"
            >
              <Stack spacing={0.5}>
                <Typography variant="h5">{tenant.companyName}</Typography>
                <Typography color="text.secondary">
                  {tenant.tenantCode}
                </Typography>
              </Stack>
              <StatusChip value={tenant.status} />
            </Stack>
            <Divider />
            <Stack spacing={2}>
              <DetailRow label="Legal Name" value={tenant.legalName} />
              <DetailRow label="Workspace code used at sign-in" value={tenant.tenantCode} />
              <DetailRow label="Email" value={tenant.email} />
              <DetailRow label="Phone" value={tenant.phone} />
              <DetailRow label="Business Type" value={tenant.businessType} />
              <DetailRow
                label="Subscription Plan"
                value={tenant.subscriptionPlan}
              />
              <DetailRow
                label="Service Types"
                value={tenant.serviceTypesEnabled.join(", ")}
              />
              <DetailRow
                label="Address"
                value={[
                  tenant.addressLine1,
                  tenant.addressLine2,
                  tenant.city,
                  tenant.state,
                  tenant.zipCode,
                  tenant.country,
                ]
                  .filter(Boolean)
                  .join(", ")}
              />
              <DetailRow label="Notes" value={tenant.notes || "-"} />
              <DetailRow
                label="Created"
                value={`${tenant.createdBy} • ${formatDateTime(tenant.createdAt)}`}
              />
              <DetailRow
                label="Updated"
                value={`${tenant.updatedBy} • ${formatDateTime(tenant.updatedAt)}`}
              />
            </Stack>
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        {tenant ? (
          <Button
            component={RouterLink}
            to={`/platform/users?create=1&tenantId=${encodeURIComponent(tenant.id)}&role=ROLE_TENANT_ADMIN`}
            startIcon={<PersonAddRoundedIcon />}
            variant="contained"
            onClick={onClose}
          >
            Create tenant admin
          </Button>
        ) : null}
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
