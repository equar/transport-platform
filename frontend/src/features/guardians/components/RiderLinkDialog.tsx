import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { getApiErrorMessage } from "../../../shared/api/client";
import {
  ridersApi,
  riderGuardianRelationshipTypeOptions,
  type RiderRecord,
  type RiderGuardianPayload,
} from "../../riders/api/ridersApi";
import type { GuardianRecord } from "../api/guardiansApi";

interface Props {
  open: boolean;
  guardian: GuardianRecord;
  saving: boolean;
  onClose: () => void;
  onSubmit: (riderId: number, payload: RiderGuardianPayload) => Promise<void>;
}

export function RiderLinkDialog({
  open,
  guardian,
  saving,
  onClose,
  onSubmit,
}: Props) {
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(0);
  const [riders, setRiders] = useState<RiderRecord[]>([]);
  const [selected, setSelected] = useState<RiderRecord | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [form, setForm] = useState<RiderGuardianPayload>({
    guardianId: guardian.id,
    relationshipType: "PARENT",
    primaryGuardian: false,
    authorizedForPickup: false,
    billingContact: false,
    notes: "",
  });

  useEffect(() => {
    if (!open) return;
    setKeyword("");
    setPage(0);
    setRiders([]);
    setSelected(null);
    setError(null);
    setForm({
      guardianId: guardian.id,
      relationshipType: "PARENT",
      primaryGuardian: false,
      authorizedForPickup: false,
      billingContact: false,
      notes: "",
    });
  }, [open, guardian.id]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setSearching(true);
    setError(null);
    const timer = setTimeout(() => {
      void ridersApi
        .search({
          keyword,
          page,
          size: 25,
          status: "",
          riderType: "",
          wheelchairRequired: "",
          escortRequired: "",
          sortBy: "lastName",
          sortDirection: "ASC",
        })
        .then((result) => {
          if (cancelled) return;
          setRiders(result.items);
          setPages(result.totalPages);
        })
        .catch((cause: unknown) => {
          if (!cancelled) {
            setRiders([]);
            setError(getApiErrorMessage(cause, "Riders could not be loaded."));
          }
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, keyword, page, retry]);

  const linkedIds = new Set(
    guardian.riders
      .filter((rider) => rider.status === "ACTIVE")
      .map((rider) => rider.riderId),
  );
  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Link Rider</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography>
            Associate a rider with {guardian.firstName} {guardian.lastName}.
          </Typography>
          <TextField
            label="Search riders"
            value={keyword}
            disabled={saving}
            onChange={(event) => {
              setKeyword(event.target.value);
              setPage(0);
            }}
            helperText="Search by name, rider code, email, or phone."
            fullWidth
          />
          {error ? (
            <Alert
              severity="error"
              action={
                <Button onClick={() => setRetry((value) => value + 1)}>
                  Retry
                </Button>
              }
            >
              {error}
            </Alert>
          ) : null}
          <TextField
            select
            label="Rider"
            value={selected?.id ?? ""}
            disabled={saving || searching}
            onChange={(event) =>
              setSelected(
                riders.find(
                  (rider) => rider.id === Number(event.target.value),
                ) ?? null,
              )
            }
            helperText={
              searching
                ? "Loading riders…"
                : !riders.length
                  ? "No riders found. Try another search."
                  : "Already linked riders cannot be selected."
            }
            fullWidth
          >
            <MenuItem value="">Select rider</MenuItem>
            {selected && !riders.some((rider) => rider.id === selected.id) ? (
              <MenuItem value={selected.id}>
                {selected.firstName} {selected.lastName} • {selected.riderCode}
              </MenuItem>
            ) : null}
            {riders.map((rider) => (
              <MenuItem
                key={rider.id}
                value={rider.id}
                disabled={linkedIds.has(rider.id)}
              >
                {rider.firstName} {rider.lastName} • {rider.riderCode}
                {linkedIds.has(rider.id) ? " (Already linked)" : ""}
              </MenuItem>
            ))}
          </TextField>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              disabled={saving || searching || page === 0}
              onClick={() => setPage((value) => value - 1)}
            >
              Previous
            </Button>
            <Typography variant="body2">
              Page {page + 1} of {Math.max(pages, 1)}
            </Typography>
            <Button
              disabled={saving || searching || page + 1 >= pages}
              onClick={() => setPage((value) => value + 1)}
            >
              Next
            </Button>
          </Stack>
          <TextField
            select
            label="Relationship Type"
            value={form.relationshipType}
            disabled={saving}
            onChange={(event) =>
              setForm((value) => ({
                ...value,
                relationshipType: event.target
                  .value as RiderGuardianPayload["relationshipType"],
              }))
            }
            fullWidth
          >
            {riderGuardianRelationshipTypeOptions.map((value) => (
              <MenuItem key={value} value={value}>
                {value.replaceAll("_", " ")}
              </MenuItem>
            ))}
          </TextField>
          <Typography variant="body2" color="text.secondary">
            Linking grants this guardian access to the rider in the guardian
            portal. Setting a primary guardian replaces the rider’s current
            primary guardian; the first guardian is automatically primary.
          </Typography>
          {(
            [
              ["primaryGuardian", "Primary Guardian"],
              ["authorizedForPickup", "Authorized for Pickup"],
              ["billingContact", "Billing Contact"],
            ] as const
          ).map(([field, label]) => (
            <FormControlLabel
              key={field}
              label={label}
              control={
                <Switch
                  checked={form[field]}
                  disabled={saving}
                  onChange={(event) =>
                    setForm((value) => ({
                      ...value,
                      [field]: event.target.checked,
                    }))
                  }
                />
              }
            />
          ))}
          <TextField
            label="Notes"
            multiline
            minRows={2}
            value={form.notes}
            disabled={saving}
            inputProps={{ maxLength: 2000 }}
            onChange={(event) =>
              setForm((value) => ({ ...value, notes: event.target.value }))
            }
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={saving || !selected || linkedIds.has(selected.id)}
          onClick={() => {
            if (selected) void onSubmit(selected.id, form);
          }}
        >
          {saving ? "Saving…" : "Link Rider"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
