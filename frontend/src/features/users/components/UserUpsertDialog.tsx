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
  Alert,
  Autocomplete,
  CircularProgress,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import type { RoleCatalogItem } from "../../roles/api/rolesApi";
import { usersApi } from "../api/usersApi";
import type {
  PortalSubjectOption,
  UserRecord,
  UserScope,
  UserUpsertPayload,
} from "../api/usersApi";
import type { PortalSubjectType } from "../api/usersApi";
import { FormSection } from "../../../shared/components/FormSection";

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
    portalSubjectType: null,
    portalSubjectId: null,
  });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [portalOptions, setPortalOptions] = useState<PortalSubjectOption[]>([]);
  const [portalOptionsLoading, setPortalOptionsLoading] = useState(false);
  const [portalOptionsError, setPortalOptionsError] = useState<string | null>(null);

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
      portalSubjectType: user?.portalSubjectType ?? null,
      portalSubjectId: user?.portalSubjectId ?? null,
    });
    setValidationError(null);
  }, [open, user]);

  useEffect(() => {
    if (!open || scope !== "company" || !form.portalSubjectType) {
      setPortalOptions([]);
      setPortalOptionsError(null);
      return;
    }

    let active = true;
    setPortalOptionsLoading(true);
    setPortalOptionsError(null);
    void usersApi
      .listPortalSubjects(form.portalSubjectType)
      .then((options) => {
        if (active) {
          setPortalOptions(options);
        }
      })
      .catch(() => {
        if (active) {
          setPortalOptions([]);
          setPortalOptionsError(
            "Operational records could not be loaded. Close the dialog and try again.",
          );
        }
      })
      .finally(() => {
        if (active) {
          setPortalOptionsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [form.portalSubjectType, open, scope]);

  const portalRoleTypes: Array<{ role: string; type: PortalSubjectType; label: string }> = [
    { role: "ROLE_DRIVER", type: "DRIVER", label: "Driver" },
    { role: "ROLE_RIDER", type: "RIDER", label: "Rider" },
    { role: "ROLE_GUARDIAN", type: "GUARDIAN", label: "Guardian" },
    { role: "ROLE_ORGANIZATION_USER", type: "ORGANIZATION_CONTACT", label: "Organization contact" },
  ];
  const selectedPortalTypes = portalRoleTypes.filter((item) => form.roles.includes(item.role));

  async function submit() {
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = form.email.trim();
    if (!firstName || !lastName || !email) {
      setValidationError("First name, last name, and email are required.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setValidationError("Enter a valid email address.");
      return;
    }
    if (!user && (!form.password || form.password.length < 8)) {
      setValidationError("A password of at least 8 characters is required for a new user.");
      return;
    }
    if (form.password && form.password.length < 8) {
      setValidationError("The password must contain at least 8 characters.");
      return;
    }
    if (form.roles.length === 0) {
      setValidationError("Select at least one role.");
      return;
    }
    if (scope === "platform" && !form.tenantId?.trim() && !form.roles.includes("ROLE_PLATFORM_ADMIN")) {
      setValidationError("A tenant ID is required for tenant-scoped roles.");
      return;
    }
    if (
      scope === "company" &&
      selectedPortalTypes.length > 0 &&
      !portalOptionsLoading &&
      portalOptions.length === 0
    ) {
      const identityLabel =
        selectedPortalTypes.find(
          (item) => item.type === form.portalSubjectType,
        )?.label ?? "portal identity";
      setValidationError(
        `No ${identityLabel.toLowerCase()} record is available. Create the operational record first, then return here to grant login access.`,
      );
      return;
    }
    if (selectedPortalTypes.length > 0 && (!form.portalSubjectType || !form.portalSubjectId)) {
      setValidationError("Link this portal account to its driver, rider, guardian, or organization contact record.");
      return;
    }
    setValidationError(null);
    await onSubmit(form);
  }

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle sx={{ pb: 0.75 }}>{user ? "Edit user" : "Create user"}</DialogTitle>
      <DialogContent dividers>
        <Stack divider={<Box sx={{ borderTop: "1px solid", borderColor: "divider" }} />}>
          {validationError ? <Alert severity="error">{validationError}</Alert> : null}
          <FormSection title="Profile" description="The name and email used for sign-in and notifications.">
            <Stack spacing={2}>
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
            </Stack>
          </FormSection>
          <FormSection title="Access scope" description="Control where this user belongs and whether they can sign in.">
            <Stack spacing={2}>
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
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  label="Status"
                  select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, status: event.target.value }))
                  }
                  fullWidth
                >
                  {userStatuses.map((status) => (
                    <MenuItem key={status} value={status}>{status.replaceAll("_", " ")}</MenuItem>
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
                      const nextRoles = typeof value === "string" ? value.split(",") : value;
                      const matchingPortalTypes = portalRoleTypes.filter((item) => nextRoles.includes(item.role));
                      setForm((current) => ({
                        ...current,
                        roles: nextRoles,
                        portalSubjectType: matchingPortalTypes.length === 1 ? matchingPortalTypes[0].type : current.portalSubjectType,
                        portalSubjectId: matchingPortalTypes.length === 0 ? null : current.portalSubjectId,
                      }));
                    }}
                    input={<OutlinedInput label="Roles" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {selected.map((value) => <Chip key={value} label={roles.find((item) => item.name === value)?.displayName ?? value} size="small" />)}
                      </Box>
                    )}
                  >
                    {roles.map((role) => <MenuItem key={role.name} value={role.name}>{role.displayName}</MenuItem>)}
                  </Select>
                </FormControl>
              </Stack>
            </Stack>
          </FormSection>
          <FormSection title="Security" description={user ? "Set a new password only when access needs to be reset." : "Create the user’s initial sign-in credential."}>
            <TextField
            label={user ? "New password (optional)" : "Password"}
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
                : "Minimum 8 characters."
            }
            fullWidth
            />
          </FormSection>
          {selectedPortalTypes.length > 0 ? (
            <FormSection title="Portal identity" description="Connect this login to the operational record it represents. Each record can be linked to only one user.">
              <Stack spacing={2}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField fullWidth label="Identity type" select value={form.portalSubjectType ?? ""} onChange={(event) => setForm((current) => ({ ...current, portalSubjectType: event.target.value as PortalSubjectType, portalSubjectId: null }))}>
                  {selectedPortalTypes.map((item) => <MenuItem key={item.type} value={item.type}>{item.label}</MenuItem>)}
                </TextField>
                {scope === "company" ? (
                  <Autocomplete
                    fullWidth
                    options={portalOptions}
                    loading={portalOptionsLoading}
                    noOptionsText={
                      portalOptionsLoading
                        ? "Loading operational records..."
                        : `No ${
                            selectedPortalTypes
                              .find(
                                (item) =>
                                  item.type === form.portalSubjectType,
                              )
                              ?.label.toLowerCase() ?? "matching"
                          } records are available. Create the operational record first.`
                    }
                    value={
                      portalOptions.find(
                        (option) => option.id === form.portalSubjectId,
                      ) ?? null
                    }
                    isOptionEqualToValue={(option, value) =>
                      option.id === value.id && option.type === value.type
                    }
                    getOptionLabel={(option) =>
                      `${option.displayName}${option.reference ? ` · ${option.reference}` : ""}`
                    }
                    getOptionDisabled={(option) =>
                      option.linked && option.id !== form.portalSubjectId
                    }
                    onChange={(_, option) =>
                      setForm((current) => ({
                        ...current,
                        portalSubjectId: option?.id ?? null,
                        firstName: current.firstName || option?.firstName || "",
                        lastName: current.lastName || option?.lastName || "",
                        email: current.email || option?.email || "",
                      }))
                    }
                    renderOption={(props, option) => (
                      <li {...props}>
                        <Stack spacing={0.25}>
                          <Typography variant="body2">
                            {option.displayName}
                            {option.linked && option.id !== form.portalSubjectId
                              ? " · Already linked"
                              : ""}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {[option.reference, option.email, option.status]
                              .filter(Boolean)
                              .join(" · ")}
                          </Typography>
                        </Stack>
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Operational record"
                        placeholder="Search by name, code, or email"
                        error={Boolean(portalOptionsError)}
                        helperText={
                          portalOptionsError ||
                          "Select the person this login belongs to."
                        }
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {portalOptionsLoading ? (
                                <CircularProgress color="inherit" size={18} />
                              ) : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                ) : (
                  <TextField fullWidth label="Operational record ID" type="number" value={form.portalSubjectId ?? ""} onChange={(event) => setForm((current) => ({ ...current, portalSubjectId: event.target.value ? Number(event.target.value) : null }))} inputProps={{ min: 1 }} helperText="Use the record ID from the selected tenant." />
                )}
                </Stack>
              </Stack>
            </FormSection>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={() => void submit()}
          variant="contained"
          disabled={loading}
        >
          {loading ? "Saving..." : user ? "Save Changes" : "Create User"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
