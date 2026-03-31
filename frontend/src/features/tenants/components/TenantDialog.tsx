import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import type { Tenant, TenantPayload } from "../api/tenantsApi";

interface TenantDialogProps {
  open: boolean;
  initialValue?: Tenant | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (payload: TenantPayload) => Promise<void>;
}

const serviceTypeOptions = [
  "DISPATCH",
  "FLEET",
  "LAST_MILE",
  "LINE_HAUL",
  "PARATRANSIT",
];
const subscriptionPlans = ["STARTER", "GROWTH", "ENTERPRISE"];

const emptyForm: TenantPayload = {
  tenantCode: "",
  companyName: "",
  legalName: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  zipCode: "",
  country: "",
  businessType: "",
  subscriptionPlan: "STARTER",
  serviceTypesEnabled: [],
  notes: "",
};

function toStringArray(value: string | string[]) {
  return Array.isArray(value)
    ? value
    : value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}

export function TenantDialog({
  open,
  initialValue,
  loading = false,
  onClose,
  onSubmit,
}: TenantDialogProps) {
  const [form, setForm] = useState<TenantPayload>(emptyForm);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!initialValue) {
      setForm(emptyForm);
      return;
    }

    setForm({
      tenantCode: initialValue.tenantCode,
      companyName: initialValue.companyName,
      legalName: initialValue.legalName,
      email: initialValue.email,
      phone: initialValue.phone,
      addressLine1: initialValue.addressLine1,
      addressLine2: initialValue.addressLine2 ?? "",
      city: initialValue.city,
      state: initialValue.state,
      zipCode: initialValue.zipCode,
      country: initialValue.country,
      businessType: initialValue.businessType,
      subscriptionPlan: initialValue.subscriptionPlan,
      serviceTypesEnabled: initialValue.serviceTypesEnabled,
      notes: initialValue.notes ?? "",
    });
  }, [initialValue, open]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(form);
  }

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        {initialValue ? "Edit Tenant" : "Create Tenant"}
      </DialogTitle>
      <DialogContent>
        <Stack
          component="form"
          spacing={2}
          sx={{ mt: 1 }}
          onSubmit={handleSubmit}
        >
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Tenant Code"
              value={form.tenantCode}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  tenantCode: event.target.value,
                }))
              }
              required
            />
            <TextField
              label="Subscription Plan"
              select
              value={form.subscriptionPlan}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  subscriptionPlan: event.target.value,
                }))
              }
              required
            >
              {subscriptionPlans.map((plan) => (
                <MenuItem key={plan} value={plan}>
                  {plan}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Company Name"
              value={form.companyName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  companyName: event.target.value,
                }))
              }
              required
            />
            <TextField
              label="Legal Name"
              value={form.legalName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  legalName: event.target.value,
                }))
              }
              required
            />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              required
            />
            <TextField
              label="Phone"
              value={form.phone}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
              required
            />
          </Stack>
          <TextField
            label="Business Type"
            value={form.businessType}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                businessType: event.target.value,
              }))
            }
            required
          />
          <TextField
            label="Address Line 1"
            value={form.addressLine1}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                addressLine1: event.target.value,
              }))
            }
            required
          />
          <TextField
            label="Address Line 2"
            value={form.addressLine2}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                addressLine2: event.target.value,
              }))
            }
          />
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="City"
              value={form.city}
              onChange={(event) =>
                setForm((current) => ({ ...current, city: event.target.value }))
              }
              required
            />
            <TextField
              label="State"
              value={form.state}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  state: event.target.value,
                }))
              }
              required
            />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="ZIP Code"
              value={form.zipCode}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  zipCode: event.target.value,
                }))
              }
              required
            />
            <TextField
              label="Country"
              value={form.country}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  country: event.target.value,
                }))
              }
              required
            />
          </Stack>
          <TextField
            label="Enabled Service Types"
            select
            SelectProps={{ multiple: true }}
            value={form.serviceTypesEnabled}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                serviceTypesEnabled: toStringArray(event.target.value),
              }))
            }
            required
          >
            {serviceTypeOptions.map((serviceType) => (
              <MenuItem key={serviceType} value={serviceType}>
                {serviceType}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Notes"
            multiline
            minRows={3}
            value={form.notes}
            onChange={(event) =>
              setForm((current) => ({ ...current, notes: event.target.value }))
            }
          />
          <DialogActions sx={{ px: 0, pb: 0 }}>
            <Button onClick={onClose} color="inherit" disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading
                ? "Saving..."
                : initialValue
                  ? "Save Changes"
                  : "Create Tenant"}
            </Button>
          </DialogActions>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
