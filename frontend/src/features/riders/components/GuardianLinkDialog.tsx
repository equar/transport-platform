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
import { useEffect, useMemo, useState } from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { Link as RouterLink } from "react-router-dom";
import {
  guardiansApi,
  type GuardianRecord,
} from "../../guardians/api/guardiansApi";
import type {
  RiderGuardianPayload,
  RiderGuardianRecord,
  RiderGuardianRelationshipType,
} from "../api/ridersApi";
import { riderGuardianRelationshipTypeOptions } from "../api/ridersApi";

interface GuardianLinkDialogProps {
  open: boolean;
  searchEnabled?: boolean;
  guardians: GuardianRecord[];
  linkedGuardianIds: number[];
  relationship: RiderGuardianRecord | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: RiderGuardianPayload) => Promise<void>;
}

function emptyForm(): RiderGuardianPayload {
  return {
    guardianId: 0,
    relationshipType: "PARENT",
    primaryGuardian: false,
    authorizedForPickup: false,
    billingContact: false,
    notes: "",
  };
}

export function GuardianLinkDialog({
  open,
  searchEnabled = false,
  guardians,
  linkedGuardianIds,
  relationship,
  loading,
  onClose,
  onSubmit,
}: GuardianLinkDialogProps) {
  const [form, setForm] = useState<RiderGuardianPayload>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(0);
  const [results, setResults] = useState<GuardianRecord[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [chosenGuardian, setChosenGuardian] = useState<GuardianRecord | null>(
    null,
  );
  useEffect(() => {
    if (open) {
      setKeyword("");
      setPage(0);
      setResults([]);
      setChosenGuardian(null);
    }
  }, [open]);
  useEffect(() => {
    if (!open || !searchEnabled || relationship) return;
    let cancelled = false;
    setSearching(true);
    setSearchError(false);
    const timer = setTimeout(() => {
      void guardiansApi
        .search({
          keyword,
          page,
          size: 25,
          status: "",
          authorizedForPickup: "",
          billingContact: "",
          sortBy: "lastName",
          sortDirection: "ASC",
        })
        .then((response) => {
          if (!cancelled) {
            setResults(response.items);
            setPages(response.totalPages);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setResults([]);
            setSearchError(true);
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
  }, [open, searchEnabled, relationship, keyword, page, retry]);
  const options = searchEnabled && !relationship ? results : guardians;
  const displayOptions =
    chosenGuardian && !options.some((item) => item.id === chosenGuardian.id)
      ? [chosenGuardian, ...options]
      : options;

  useEffect(() => {
    if (!open) {
      return;
    }
    setErrors({});
    if (!relationship) {
      setForm(emptyForm());
      return;
    }
    setForm({
      guardianId: relationship.guardianId,
      relationshipType: relationship.relationshipType,
      primaryGuardian: relationship.primaryGuardian,
      authorizedForPickup: relationship.authorizedForPickup,
      billingContact: relationship.billingContact,
      notes: relationship.notes ?? "",
    });
  }, [open, relationship]);

  const selectedGuardian = useMemo(
    () =>
      displayOptions.find((guardian) => guardian.id === form.guardianId) ??
      null,
    [form.guardianId, displayOptions],
  );

  function updateField<Key extends keyof RiderGuardianPayload>(
    field: Key,
    value: RiderGuardianPayload[Key],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field as string];
      return next;
    });
  }

  function validate() {
    const nextErrors: Record<string, string> = {};
    if (!form.guardianId) {
      nextErrors.guardianId = "Guardian selection is required.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) {
      return;
    }
    if (!relationship && linkedGuardianIds.includes(form.guardianId)) {
      setErrors({
        guardianId:
          "This guardian is already linked to this rider. Use Update Guardian Link to change the relationship.",
      });
      return;
    }
    await onSubmit(form);
  }

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <span>{relationship ? "Update Guardian Link" : "Link Guardian"}</span>
        <Button
          component={RouterLink}
          to="/company/guardians?create=1"
          startIcon={<AddRoundedIcon />}
          variant="outlined"
          size="small"
          onClick={onClose}
          disabled={loading}
        >
          Create Guardian
        </Button>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {searchEnabled && !relationship ? (
            <>
              <TextField
                label="Search guardians"
                value={keyword}
                disabled={loading}
                onChange={(event) => {
                  setKeyword(event.target.value);
                  setPage(0);
                }}
                helperText="Search by name, email, or phone."
                fullWidth
              />
              {searchError ? (
                <Alert
                  severity="error"
                  action={
                    <Button onClick={() => setRetry((value) => value + 1)}>
                      Retry
                    </Button>
                  }
                >
                  Guardians could not be loaded.
                </Alert>
              ) : null}
              <Stack direction="row" alignItems="center" spacing={1}>
                <Button
                  disabled={loading || searching || page === 0}
                  onClick={() => setPage((value) => value - 1)}
                >
                  Previous
                </Button>
                <Typography variant="body2">
                  Page {page + 1} of {Math.max(pages, 1)}
                </Typography>
                <Button
                  disabled={loading || searching || page + 1 >= pages}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Next
                </Button>
              </Stack>
            </>
          ) : null}
          <TextField
            label="Guardian"
            select
            value={
              displayOptions.some((guardian) => guardian.id === form.guardianId) ||
              relationship?.guardianId === form.guardianId
                ? form.guardianId
                : ""
            }
            onChange={(event) => {
              updateField("guardianId", Number(event.target.value));
              setChosenGuardian(
                displayOptions.find(
                  (item) => item.id === Number(event.target.value),
                ) ?? null,
              );
            }}
            error={Boolean(errors.guardianId)}
            helperText={
              errors.guardianId ||
              (searching
                ? "Loading guardians…"
                : searchEnabled && !relationship && !results.length
                  ? "No guardians found. Try another search."
                  : undefined)
            }
            disabled={loading || searching || Boolean(relationship)}
            fullWidth
          >
            <MenuItem value="">Select guardian</MenuItem>
            {relationship &&
            !displayOptions.some(
              (item) => item.id === relationship.guardianId,
            ) ? (
              <MenuItem value={relationship.guardianId}>
                {relationship.guardianDisplayName}
              </MenuItem>
            ) : null}
            {displayOptions.map((guardian) => (
              <MenuItem
                key={guardian.id}
                value={guardian.id}
                disabled={
                  searchEnabled &&
                  !relationship &&
                  linkedGuardianIds.includes(guardian.id)
                }
              >
                {guardian.firstName} {guardian.lastName}
                {guardian.email ? ` • ${guardian.email}` : ""}
              </MenuItem>
            ))}
          </TextField>
          {selectedGuardian ? (
            <Typography variant="body2" color="text.secondary">
              {selectedGuardian.phone}
              {selectedGuardian.relationToRiderDefault
                ? ` • ${selectedGuardian.relationToRiderDefault}`
                : ""}
            </Typography>
          ) : null}
          <TextField
            disabled={loading}
            label="Relationship Type"
            select
            value={form.relationshipType}
            onChange={(event) =>
              updateField(
                "relationshipType",
                event.target.value as RiderGuardianRelationshipType,
              )
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
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormControlLabel
              control={
                <Switch
                  disabled={loading}
                  checked={form.primaryGuardian}
                  onChange={(event) =>
                    updateField("primaryGuardian", event.target.checked)
                  }
                />
              }
              label="Primary Guardian"
            />
            <FormControlLabel
              control={
                <Switch
                  disabled={loading}
                  checked={form.authorizedForPickup}
                  onChange={(event) =>
                    updateField("authorizedForPickup", event.target.checked)
                  }
                />
              }
              label="Authorized for Pickup"
            />
            <FormControlLabel
              control={
                <Switch
                  disabled={loading}
                  checked={form.billingContact}
                  onChange={(event) =>
                    updateField("billingContact", event.target.checked)
                  }
                />
              }
              label="Billing Contact"
            />
          </Stack>
          <TextField
            disabled={loading}
            inputProps={{ maxLength: 2000 }}
            label="Notes"
            value={form.notes ?? ""}
            onChange={(event) => updateField("notes", event.target.value)}
            multiline
            minRows={3}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={() => void handleSubmit()}
          variant="contained"
          disabled={loading}
        >
          {loading
            ? "Saving..."
            : relationship
              ? "Save Changes"
              : "Link Guardian"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
