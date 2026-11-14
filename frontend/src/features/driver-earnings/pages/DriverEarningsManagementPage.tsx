import {
  Alert,
  Button,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { getApiErrorMessage } from "../../../shared/api/client";
import { LoadingState } from "../../../shared/components/LoadingState";
import { PageCard } from "../../../shared/components/PageCard";
import { PageHero } from "../../../shared/components/PageHero";
import { driverEarningsApi, type DriverEarningsEntry } from "../api/driverEarningsApi";

const statusLabels: Record<DriverEarningsEntry["status"], string> = {
  PENDING_CALCULATION: "Awaiting calculation",
  PENDING_REVIEW: "Awaiting approval",
  APPROVED: "Approved",
};

export function DriverEarningsManagementPage() {
  const [entries, setEntries] = useState<DriverEarningsEntry[] | null>(null);
  const [rate, setRate] = useState("");
  const [driverId, setDriverId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editReason, setEditReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = async (): Promise<boolean> => {
    try {
      const [nextEntries, nextRate] = await Promise.all([driverEarningsApi.list(), driverEarningsApi.getRate()]);
      setEntries(nextEntries);
      setRate(nextRate == null ? "" : String(nextRate));
      setError(null);
      return true;
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, "Driver earnings could not be loaded."));
      return false;
    }
  };

  useEffect(() => {
    void load();
  }, []);

  if (!entries && !error) return <LoadingState />;

  const saveRate = async () => {
    try {
      await driverEarningsApi.setRate(Number(rate));
      if (!await load()) return;
      setNotice("The earnings rate was saved. Newly calculable records are awaiting your review.");
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, "Enter a valid earnings rate."));
    }
  };

  const adjust = async () => {
    try {
      await driverEarningsApi.adjust(Number(driverId), Number(amount), reason);
      setDriverId("");
      setAmount("");
      setReason("");
      if (!await load()) return;
      setNotice("The ledger adjustment was recorded.");
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, "A driver, non-zero amount, and reason are required."));
    }
  };

  const beginEdit = (entry: DriverEarningsEntry) => {
    setEditingId(entry.id);
    setEditAmount(entry.amount == null ? "" : String(entry.amount));
    setEditReason(entry.reason ?? "");
  };

  const saveEdit = async (entryId: number) => {
    try {
      await driverEarningsApi.updateEntry(entryId, Number(editAmount), editReason);
      setEditingId(null);
      if (!await load()) return;
      setNotice("The earnings record was updated and remains awaiting approval.");
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, "The earnings record could not be updated."));
    }
  };

  const approve = async (entryId: number) => {
    try {
      await driverEarningsApi.approve(entryId);
      if (!await load()) return;
      setNotice("The earnings record was approved.");
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, "The earnings record could not be approved."));
    }
  };

  return (
    <Stack spacing={2.5}>
      <PageHero
        eyebrow="Payments"
        title="Driver earnings"
        description="Review driver compensation separately from customer invoice payments."
      />
      {error && <Alert severity="error">{error}</Alert>}
      {notice && <Alert severity="success" onClose={() => setNotice(null)}>{notice}</Alert>}
      <PageCard>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="end">
          <TextField
            label="Earnings rate (%)"
            value={rate}
            onChange={(event) => setRate(event.target.value)}
            type="number"
            inputProps={{ min: 0, max: 100, step: "0.01" }}
          />
          <Button variant="contained" onClick={saveRate}>Save rate</Button>
          <Typography color="text.secondary">
            Records without an issued ride charge or rate remain awaiting calculation.
          </Typography>
        </Stack>
      </PageCard>
      <PageCard>
        <Typography variant="h6" gutterBottom>Ledger adjustment</Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <TextField label="Driver ID" value={driverId} onChange={(event) => setDriverId(event.target.value)} />
          <TextField label="Amount (+/-)" value={amount} onChange={(event) => setAmount(event.target.value)} type="number" />
          <TextField required fullWidth label="Reason" value={reason} onChange={(event) => setReason(event.target.value)} />
          <Button variant="outlined" onClick={adjust}>Add adjustment</Button>
        </Stack>
      </PageCard>
      <PageCard>
        <Typography variant="h6">Ledger history</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Driver</TableCell>
              <TableCell>Trip</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Billable ride charge</TableCell>
              <TableCell>Earnings</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(entries ?? []).map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{entry.driverName ?? `Driver #${entry.driverId}`}</TableCell>
                <TableCell>{entry.rideNumber ?? (entry.rideId ? `Trip #${entry.rideId}` : "-")}</TableCell>
                <TableCell><Chip size="small" label={statusLabels[entry.status]} /></TableCell>
                <TableCell>
                  {entry.billableAmount == null ? "-" : `${entry.currency} ${entry.billableAmount.toFixed(2)}`}
                </TableCell>
                <TableCell>{entry.amount == null ? "-" : `${entry.currency} ${entry.amount.toFixed(2)}`}</TableCell>
                <TableCell>
                  {editingId === entry.id ? (
                    <Stack spacing={1} minWidth={220}>
                      <TextField
                        size="small"
                        label="Earnings amount"
                        type="number"
                        value={editAmount}
                        onChange={(event) => setEditAmount(event.target.value)}
                      />
                      <TextField
                        size="small"
                        label="Review reason"
                        value={editReason}
                        onChange={(event) => setEditReason(event.target.value)}
                      />
                    </Stack>
                  ) : entry.reason ?? "-"}
                </TableCell>
                <TableCell>
                  {entry.status === "APPROVED" ? null : editingId === entry.id ? (
                    <Stack direction="row" spacing={1}>
                      <Button size="small" onClick={() => void saveEdit(entry.id)}>Save</Button>
                      <Button size="small" onClick={() => setEditingId(null)}>Cancel</Button>
                    </Stack>
                  ) : (
                    <Stack direction="row" spacing={1}>
                      <Button size="small" onClick={() => beginEdit(entry)}>Edit</Button>
                      {entry.status === "PENDING_REVIEW" && (
                        <Button size="small" variant="contained" onClick={() => void approve(entry.id)}>
                          Approve
                        </Button>
                      )}
                    </Stack>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </PageCard>
    </Stack>
  );
}
