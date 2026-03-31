import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
} from "@mui/material";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PauseCircleRoundedIcon from "@mui/icons-material/PauseCircleRounded";
import PersonOffRoundedIcon from "@mui/icons-material/PersonOffRounded";
import PersonAddRoundedIcon from "@mui/icons-material/PersonAddRounded";
import { getRoleLabel, isPlatformAdmin } from "../../auth/access";
import { useAuth } from "../../auth/context/AuthContext";
import { rolesApi, type RoleCatalogItem } from "../../roles/api/rolesApi";
import { AdminFilterBar } from "../../../shared/components/AdminFilterBar";
import { ConfirmDialog } from "../../../shared/components/ConfirmDialog";
import { EmptyState } from "../../../shared/components/EmptyState";
import { LoadingState } from "../../../shared/components/LoadingState";
import { PageCard } from "../../../shared/components/PageCard";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { StatusChip } from "../../../shared/components/StatusChip";
import { TableActionButton } from "../../../shared/components/TableActionButton";
import { useToast } from "../../../shared/providers/ToastProvider";
import { formatDateTime } from "../../../shared/utils/format";
import { UserUpsertDialog } from "../components/UserUpsertDialog";
import {
  usersApi,
  type UserRecord,
  type UserScope,
  type UserUpsertPayload,
} from "../api/usersApi";

const userStatuses = ["", "ACTIVE", "INVITED", "SUSPENDED", "DEACTIVATED"];

export function UserManagementPage() {
  const { session } = useAuth();
  const platformAdmin = isPlatformAdmin(session);
  const scope: UserScope = platformAdmin ? "platform" : "company";
  const { showError, showSuccess } = useToast();
  const [items, setItems] = useState<UserRecord[]>([]);
  const [roles, setRoles] = useState<RoleCatalogItem[]>([]);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [role, setRole] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusAction, setStatusAction] = useState<{
    type: "activate" | "suspend" | "deactivate";
    user: UserRecord;
  } | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  async function loadRoles() {
    const response = await rolesApi.list(scope);
    setRoles(response);
  }

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      const response = await usersApi.search(scope, {
        keyword,
        status,
        role,
        tenantId,
        page,
        size,
      });
      setItems(response.items);
      setTotal(response.totalElements);
    } catch {
      setError("Users could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRoles();
  }, [scope]);

  useEffect(() => {
    void loadUsers();
  }, [scope, keyword, status, role, tenantId, page, size]);

  async function handleSubmit(payload: UserUpsertPayload) {
    setSaving(true);
    try {
      if (selectedUser) {
        await usersApi.update(scope, selectedUser.id, payload);
        showSuccess("User updated successfully.");
      } else {
        await usersApi.create(scope, payload);
        showSuccess("User created successfully.");
      }
      setDialogOpen(false);
      setSelectedUser(null);
      await loadUsers();
    } catch {
      showError("The user change could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange() {
    if (!statusAction) {
      return;
    }

    setStatusLoading(true);
    try {
      if (statusAction.type === "activate") {
        await usersApi.activate(scope, statusAction.user.id);
      } else if (statusAction.type === "suspend") {
        await usersApi.suspend(scope, statusAction.user.id);
      } else {
        await usersApi.deactivate(scope, statusAction.user.id);
      }
      showSuccess("User status updated successfully.");
      setStatusAction(null);
      await loadUsers();
    } catch {
      showError("The user status action could not be completed.");
    } finally {
      setStatusLoading(false);
    }
  }

  return (
    <Stack spacing={3}>
      <SectionHeader
        eyebrow={
          platformAdmin ? "Platform Administration" : "Company Administration"
        }
        title="User Management"
        description={
          platformAdmin
            ? "Manage platform and tenant users, assign governed roles, and enforce account lifecycle states across the SaaS portfolio."
            : "Manage your tenant’s administrators and operators while keeping role assignment inside tenant-safe boundaries."
        }
      >
        <Button
          variant="contained"
          onClick={() => {
            setSelectedUser(null);
            setDialogOpen(true);
          }}
        >
          Create User
        </Button>
      </SectionHeader>

      <AdminFilterBar>
        <TextField
          label="Search"
          placeholder="Search by name or email"
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
          sx={{ minWidth: 180 }}
        >
          {userStatuses.map((option) => (
            <MenuItem key={option || "all"} value={option}>
              {option || "All statuses"}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Role"
          select
          value={role}
          onChange={(event) => {
            setPage(0);
            setRole(event.target.value);
          }}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">All roles</MenuItem>
          {roles.map((item) => (
            <MenuItem key={item.name} value={item.name}>
              {item.displayName}
            </MenuItem>
          ))}
        </TextField>
        {platformAdmin ? (
          <TextField
            label="Tenant ID"
            value={tenantId}
            onChange={(event) => {
              setPage(0);
              setTenantId(event.target.value);
            }}
          />
        ) : null}
      </AdminFilterBar>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <PageCard sx={{ p: 0, overflow: "hidden" }}>
        {loading ? (
          <LoadingState />
        ) : items.length === 0 ? (
          <EmptyState
            title="No users found"
            description="Adjust the filters or create a new user to start managing access."
          />
        ) : (
          <>
            <Paper sx={{ overflowX: "auto" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    {platformAdmin ? <TableCell>Tenant</TableCell> : null}
                    <TableCell>Roles</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Last Login</TableCell>
                    <TableCell>Updated</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        {item.firstName} {item.lastName}
                      </TableCell>
                      <TableCell>{item.email}</TableCell>
                      {platformAdmin ? (
                        <TableCell>{item.tenantId ?? "Platform"}</TableCell>
                      ) : null}
                      <TableCell>
                        {item.roles.map(getRoleLabel).join(", ")}
                      </TableCell>
                      <TableCell>
                        <StatusChip value={item.status} />
                      </TableCell>
                      <TableCell>
                        {item.lastLoginAt
                          ? formatDateTime(item.lastLoginAt)
                          : "Never"}
                      </TableCell>
                      <TableCell>{formatDateTime(item.updatedAt)}</TableCell>
                      <TableCell align="right">
                        <TableActionButton
                          title="Edit user"
                          onClick={() => {
                            setSelectedUser(item);
                            setDialogOpen(true);
                          }}
                        >
                          <EditRoundedIcon />
                        </TableActionButton>
                        {item.status !== "ACTIVE" ? (
                          <TableActionButton
                            title="Activate user"
                            onClick={() =>
                              setStatusAction({ type: "activate", user: item })
                            }
                          >
                            <PersonAddRoundedIcon />
                          </TableActionButton>
                        ) : null}
                        {item.status === "ACTIVE" ||
                        item.status === "INVITED" ? (
                          <TableActionButton
                            title="Suspend user"
                            onClick={() =>
                              setStatusAction({ type: "suspend", user: item })
                            }
                          >
                            <PauseCircleRoundedIcon />
                          </TableActionButton>
                        ) : null}
                        {item.status !== "DEACTIVATED" ? (
                          <TableActionButton
                            title="Deactivate user"
                            onClick={() =>
                              setStatusAction({
                                type: "deactivate",
                                user: item,
                              })
                            }
                          >
                            <PersonOffRoundedIcon />
                          </TableActionButton>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
            <TablePagination
              component="div"
              count={total}
              page={page}
              rowsPerPage={size}
              onPageChange={(_, nextPage) => setPage(nextPage)}
              onRowsPerPageChange={(event) => {
                setSize(Number(event.target.value));
                setPage(0);
              }}
            />
          </>
        )}
      </PageCard>

      <UserUpsertDialog
        open={dialogOpen}
        scope={scope}
        roles={roles}
        user={selectedUser}
        loading={saving}
        onClose={() => {
          setDialogOpen(false);
          setSelectedUser(null);
        }}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(statusAction)}
        title="Confirm User Status Change"
        description={`Apply the ${statusAction?.type ?? "selected"} action to ${statusAction?.user.firstName ?? "this user"} ${statusAction?.user.lastName ?? ""}?`}
        confirmLabel={
          statusAction?.type
            ? statusAction.type[0].toUpperCase() + statusAction.type.slice(1)
            : "Confirm"
        }
        loading={statusLoading}
        onCancel={() => setStatusAction(null)}
        onConfirm={handleStatusChange}
      />
    </Stack>
  );
}
