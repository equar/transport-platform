import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import type { RoleCatalogItem } from "../../roles/api/rolesApi";
import type { UserRecord, UserScope, UserUpsertPayload } from "../api/usersApi";

interface UserUpsertDialogProps {
  open: boolean;
  scope: UserScope;
  roles: RoleCatalogItem[];
  user: UserRecord | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: UserUpsertPayload) => Promise<void>;
}

const userStatuses = ["ACTIVE", "INVITED", "SUSPENDED", "DEACTIVATED"];

export function UserUpsertDialog({
  open,
  scope,
  roles,
  user,
  loading,
  onClose,
  onSubmit,
}: UserUpsertDialogProps) {
  const [form, setForm] = useState<UserUpsertPayload>({
    tenantId: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    status: "ACTIVE",
    roles: [],
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm({
      tenantId: user?.tenantId ?? "",
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
      password: "",
      status: user?.status ?? "ACTIVE",
      roles: user?.roles ?? [],
    });
  }, [open, user]);

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>{user ? "Edit User" : "Create User"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="First name"
              value={form.firstName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  firstName: event.target.value,
                }))
              }
              fullWidth
            />
            <TextField
              label="Last name"
              value={form.lastName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  lastName: event.target.value,
                }))
              }
              fullWidth
            />
          </Stack>
          <TextField
            label="Email"
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm((current) => ({ ...current, email: event.target.value }))
            }
            fullWidth
          />
          {scope === "platform" ? (
            <TextField
              label="Tenant ID"
              value={form.tenantId ?? ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  tenantId: event.target.value,
                }))
              }
              helperText="Leave blank for a platform-scope user."
              fullWidth
            />
          ) : null}
          <TextField
            label={
              user
                ? "New password (optional)"
                : form.status === "INVITED"
                  ? "Password (optional for invited users)"
                  : "Password"
            }
            type="password"
            value={form.password ?? ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                password: event.target.value,
              }))
            }
            helperText={
              user
                ? "Leave blank to keep the current password."
                : form.status === "INVITED"
                  ? "Leave blank to send an activation email and let the user choose a password."
                  : "Minimum 8 characters."
            }
            fullWidth
          />
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Status"
              select
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value,
                }))
              }
              fullWidth
            >
              {userStatuses.map((status) => (
                <MenuItem key={status} value={status}>
                  {status.replaceAll("_", " ")}
                </MenuItem>
              ))}
            </TextField>
            <FormControl fullWidth>
              <InputLabel id="user-roles-label">Roles</InputLabel>
              <Select
                labelId="user-roles-label"
                multiple
                value={form.roles}
                onChange={(event) => {
                  const value = event.target.value;
                  setForm((current) => ({
                    ...current,
                    roles: typeof value === "string" ? value.split(",") : value,
                  }));
                }}
                input={<OutlinedInput label="Roles" />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((value) => {
                      const role = roles.find((item) => item.name === value);
                      return (
                        <Chip
                          key={value}
                          label={role?.displayName ?? value}
                          size="small"
                        />
                      );
                    })}
                  </Box>
                )}
              >
                {roles.map((role) => (
                  <MenuItem key={role.name} value={role.name}>
                    {role.displayName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={() => onSubmit(form)}
          variant="contained"
          disabled={loading}
        >
          {loading ? "Saving..." : user ? "Save Changes" : "Create User"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
