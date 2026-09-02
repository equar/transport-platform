import {
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Typography,
} from "@mui/material";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PauseCircleRoundedIcon from "@mui/icons-material/PauseCircleRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import { useEffect, useState } from "react";
import { AdminFilterBar } from "../../../shared/components/AdminFilterBar";
import { StatusChip } from "../../../shared/components/StatusChip";
import { ConfirmDialog } from "../../../shared/components/ConfirmDialog";
import { TableActionButton } from "../../../shared/components/TableActionButton";
import { formatDateTime } from "../../../shared/utils/format";
import { useToast } from "../../../shared/providers/ToastProvider";
import { tenantsApi, type Tenant, type TenantPayload } from "../api/tenantsApi";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import { useNavigate } from "react-router-dom";
import { TenantDialog } from "../components/TenantDialog";
import { TenantDetailsDialog } from "../components/TenantDetailsDialog";
import { normalizeBusinessError, type BusinessError } from "../../../shared/api/businessError";
import { BusinessErrorState } from "../../../shared/components/BusinessErrorState";
import { WorkspacePage } from "../../../shared/components/WorkspacePage";
import { DataTableShell } from "../../../shared/components/DataTableShell";

const tenantStatuses = ["", "PENDING", "ACTIVE", "SUSPENDED", "INACTIVE"];

export function TenantManagementPage() {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [items, setItems] = useState<Tenant[]>([]);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<BusinessError | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [tenantDialogOpen, setTenantDialogOpen] = useState(false);
  const [tenantSaveLoading, setTenantSaveLoading] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [actionTenant, setActionTenant] = useState<Tenant | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadTenants() {
    setLoading(true);
    setError(null);
    try {
      const response = await tenantsApi.search({ keyword, status, page, size });
      setItems(response.items);
      setTotal(response.totalElements);
    } catch (loadError) {
      setError(normalizeBusinessError(loadError, "Tenant records could not be loaded."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTenants();
  }, [keyword, page, size, status]);

  async function handleTenantSubmit(payload: TenantPayload) {
    setTenantSaveLoading(true);
    try {
      if (selectedTenant) {
        await tenantsApi.update(selectedTenant.id, payload);
        showSuccess("Tenant updated successfully.");
      } else {
        await tenantsApi.create(payload);
        showSuccess("Tenant created in pending status. Create its tenant administrator, then activate the workspace.");
      }
      setTenantDialogOpen(false);
      setSelectedTenant(null);
      await loadTenants();
    } catch (saveError) {
      showError(saveError, "Tenant changes could not be saved.");
    } finally {
      setTenantSaveLoading(false);
    }
  }

  async function handleStatusChange() {
    if (!actionTenant) {
      return;
    }

    setActionLoading(true);
    try {
      if (actionTenant.status === "ACTIVE") {
        await tenantsApi.suspend(actionTenant.id);
        showSuccess("Tenant suspended successfully.");
      } else {
        await tenantsApi.activate(actionTenant.id);
        showSuccess("Tenant activated successfully.");
      }
      setActionTenant(null);
      await loadTenants();
    } catch (statusError) {
      showError(statusError, "Tenant status could not be updated.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <WorkspacePage
        eyebrow="Platform Administration"
        title="Tenant Management"
        description="Manage provisioned transportation companies, update tenant records, and control activation status."
        primaryAction={{ label: "Create tenant", onClick: () => {
            setSelectedTenant(null);
            setTenantDialogOpen(true);
          } }}
      >

      <AdminFilterBar>
        <TextField
          label="Search"
          placeholder="Search by company name, email, phone, or code"
          value={keyword}
          onChange={(event) => {
            setPage(0);
            setKeyword(event.target.value);
          }}
        />
        <TextField
          label="Status"
          select
          value={status}
          onChange={(event) => {
            setPage(0);
            setStatus(event.target.value);
          }}
          sx={{ maxWidth: 220 }}
        >
          {tenantStatuses.map((option) => (
            <MenuItem key={option || "all"} value={option}>
              {option || "All statuses"}
            </MenuItem>
          ))}
        </TextField>
      </AdminFilterBar>

      {error ? <BusinessErrorState error={error} onRetry={() => void loadTenants()} /> : null}

      <DataTableShell
        loading={loading}
        empty={items.length === 0}
        emptyTitle="No tenants found"
        emptyDescription="Adjust the search criteria or create a new tenant to get started."
        pagination={<TablePagination
          component="div" count={total} page={page} rowsPerPage={size}
          onPageChange={(_, nextPage) => setPage(nextPage)}
          onRowsPerPageChange={(event) => { setSize(Number(event.target.value)); setPage(0); }}
        />}
      >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tenant Code</TableCell>
                    <TableCell>Company Name</TableCell>
                    <TableCell>Legal Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Subscription Plan</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Updated</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((tenant) => (
                    <TableRow key={tenant.id} hover>
                      <TableCell>{tenant.tenantCode}</TableCell>
                      <TableCell>{tenant.companyName}</TableCell>
                      <TableCell>{tenant.legalName}</TableCell>
                      <TableCell>{tenant.email}</TableCell>
                      <TableCell>{tenant.phone}</TableCell>
                      <TableCell>{tenant.subscriptionPlan}</TableCell>
                      <TableCell>
                        <StatusChip value={tenant.status} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {tenant.createdBy}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDateTime(tenant.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {tenant.updatedBy}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDateTime(tenant.updatedAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <TableActionButton
                          title="View details"
                          onClick={() => {
                            setSelectedTenant(tenant);
                            setDetailsOpen(true);
                          }}
                        >
                          <VisibilityRoundedIcon />
                        </TableActionButton>
                        <TableActionButton title="Review transport compliance"
                          onClick={() => navigate(`/platform/tenants/${tenant.id}/transport-compliance`)}>
                          <FactCheckRoundedIcon />
                        </TableActionButton>
                        <TableActionButton
                          title="Edit tenant"
                          onClick={() => {
                            setSelectedTenant(tenant);
                            setTenantDialogOpen(true);
                          }}
                        >
                          <EditRoundedIcon />
                        </TableActionButton>
                        {tenant.status === "ACTIVE" ? (
                          <TableActionButton
                            title="Suspend tenant"
                            onClick={() => setActionTenant(tenant)}
                          >
                            <PauseCircleRoundedIcon />
                          </TableActionButton>
                        ) : (
                          <TableActionButton
                            title="Activate tenant"
                            onClick={() => setActionTenant(tenant)}
                          >
                            <PlayCircleRoundedIcon />
                          </TableActionButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
      </DataTableShell>

      <TenantDialog
        open={tenantDialogOpen}
        initialValue={selectedTenant}
        loading={tenantSaveLoading}
        onClose={() => {
          setTenantDialogOpen(false);
          setSelectedTenant(null);
        }}
        onSubmit={handleTenantSubmit}
      />
      <TenantDetailsDialog
        open={detailsOpen}
        tenant={selectedTenant}
        onClose={() => setDetailsOpen(false)}
      />
      <ConfirmDialog
        open={Boolean(actionTenant)}
        title={
          actionTenant?.status === "ACTIVE"
            ? "Suspend Tenant"
            : "Activate Tenant"
        }
        description={
          actionTenant?.status === "ACTIVE"
            ? "Suspend this tenant to block operational access until it is reactivated."
            : "Activate this tenant and make it available for onboarding and operational access."
        }
        confirmLabel={
          actionTenant?.status === "ACTIVE"
            ? "Suspend Tenant"
            : "Activate Tenant"
        }
        loading={actionLoading}
        onCancel={() => setActionTenant(null)}
        onConfirm={() => void handleStatusChange()}
      />
    </WorkspacePage>
  );
}
