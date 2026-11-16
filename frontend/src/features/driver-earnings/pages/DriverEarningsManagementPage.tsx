import {
  Alert,
  Box,
  Button,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  TextField,
  Typography,
} from "@mui/material";
import CalculateRoundedIcon from "@mui/icons-material/CalculateRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import { useEffect, useState } from "react";
import { getApiErrorMessage } from "../../../shared/api/client";
import { LoadingState } from "../../../shared/components/LoadingState";
import { MetricCard } from "../../../shared/components/MetricCard";
import { PageCard } from "../../../shared/components/PageCard";
import { PageHero } from "../../../shared/components/PageHero";
import { driverEarningsApi, type DriverEarningsEntry } from "../api/driverEarningsApi";

const statusLabels: Record<DriverEarningsEntry["status"], string> = {
  PENDING_CALCULATION: "Needs calculation",
  PENDING_REVIEW: "Ready for approval",
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
  const [busyEntryId, setBusyEntryId] = useState<number | null>(null);
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

  const records = entries ?? [];
  const needsCalculationCount = records.filter((entry) => entry.status === "PENDING_CALCULATION").length;
  const awaitingApprovalCount = records.filter((entry) => entry.status === "PENDING_REVIEW").length;
  const approvedCount = records.filter((entry) => entry.status === "APPROVED").length;

  const saveRate = async () => {
    setError(null);
    try {
      await driverEarningsApi.setRate(Number(rate));
      if (!await load()) return;
      setNotice("The earnings rate was saved. Newly calculable records are awaiting your review.");
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, "Enter a valid earnings rate."));
    }
  };

  const adjust = async () => {
    setError(null);
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
    setError(null);
    setEditingId(entry.id);
    setEditAmount(entry.amount == null ? "" : String(entry.amount));
    setEditReason(entry.status === "PENDING_CALCULATION" ? "" : entry.reason ?? "");
  };

  const saveEdit = async (entryId: number) => {
    const parsedAmount = Number(editAmount);
    if (!editAmount.trim() || !Number.isFinite(parsedAmount) || parsedAmount < 0 || parsedAmount > 999999.99 || !editReason.trim()) {
      setError("Enter an earnings amount from 0 to 999,999.99 and a reason before submitting for approval.");
      return;
    }

    setError(null);
    setBusyEntryId(entryId);
    try {
      await driverEarningsApi.updateEntry(entryId, parsedAmount, editReason.trim());
      setEditingId(null);
      if (!await load()) return;
      setNotice("The earnings amount was submitted for tenant review.");
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, "The earnings record could not be updated."));
    } finally {
      setBusyEntryId(null);
    }
  };

  const approve = async (entryId: number) => {
    setError(null);
    setBusyEntryId(entryId);
    try {
      await driverEarningsApi.approve(entryId);
      if (!await load()) return;
      setNotice("The earnings record was approved.");
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, "The earnings record could not be approved."));
    } finally {
      setBusyEntryId(null);
    }
  };

  return (
    <Stack spacing={2.5}>
      <PageHero
        eyebrow="Payments"
        title="Driver earnings"
        description="Set earnings, resolve items awaiting calculation, and approve driver pay. Customer invoice payments are separate."
      />
      {error && <Alert severity="error">{error}</Alert>}
      {notice && <Alert severity="success" onClose={() => setNotice(null)}>{notice}</Alert>}
      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
        }}
      >
        <MetricCard
          icon={<CalculateRoundedIcon color="primary" />}
          label="Needs calculation"
          value={needsCalculationCount}
          caption="Waiting for a rate or issued ride charge"
        />
        <MetricCard
          icon={<FactCheckRoundedIcon color="primary" />}
          label="Ready for approval"
          value={awaitingApprovalCount}
          caption="Review and approve driver earnings"
        />
        <MetricCard
          icon={<TaskAltRoundedIcon color="primary" />}
          label="Approved records"
          value={approvedCount}
          caption="Included in the driver earnings ledger"
        />
      </Box>
      {needsCalculationCount > 0 && (
        <Alert severity="info">
          Automatic calculation needs an earnings rate and an issued ride charge. To resolve an item sooner, choose “Set amount” below and submit it for approval.
        </Alert>
      )}
      <PageCard>
        <Stack spacing={1.5}>
          <Typography variant="h6">Automatic earnings</Typography>
          <Typography variant="body2" color="text.secondary">
            Earnings are calculated as a percentage of the issued ride charge. Newly calculated amounts still need your approval.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="end">
          <TextField
            label="Earnings rate (%)"
            value={rate}
            onChange={(event) => setRate(event.target.value)}
            type="number"
            inputProps={{ min: 0, max: 100, step: "0.01" }}
          />
          <Button variant="contained" onClick={saveRate}>Save rate</Button>
          </Stack>
        </Stack>
      </PageCard>
      <PageCard>
        <Stack spacing={1.5}>
          <Typography variant="h6">One-time adjustment</Typography>
          <Typography variant="body2" color="text.secondary">
            Add an amount to a driver’s ledger. Use a negative amount for a deduction.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="start">
            <TextField label="Driver ID" value={driverId} onChange={(event) => setDriverId(event.target.value)} helperText="Find the ID on the driver record." />
            <TextField label="Amount (+/-)" value={amount} onChange={(event) => setAmount(event.target.value)} type="number" helperText="Positive adds; negative deducts." />
            <TextField required fullWidth label="Reason" value={reason} onChange={(event) => setReason(event.target.value)} />
            <Button variant="outlined" onClick={adjust}>Add adjustment</Button>
          </Stack>
        </Stack>
      </PageCard>
      <PageCard>
        <Stack spacing={1}>
          <Typography variant="h6">Earnings ledger</Typography>
          <Typography variant="body2" color="text.secondary">
            Set an amount for records needing calculation, then approve records ready for review.
          </Typography>
        </Stack>
        <TableContainer sx={{ mt: 1, overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: 1050 }}>
          <TableHead>
            <TableRow>
              <TableCell>Driver</TableCell>
              <TableCell>Trip</TableCell>
              <TableCell>Next step</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Ride charge</TableCell>
              <TableCell>Rate</TableCell>
              <TableCell>Earnings</TableCell>
              <TableCell>Reason</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>
                  <Stack>
                    <Typography variant="body2" fontWeight={600}>{entry.driverName ?? `Driver #${entry.driverId}`}</Typography>
                    <Typography variant="caption" color="text.secondary">ID {entry.driverId}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack>
                    <Typography variant="body2">{entry.rideNumber ?? (entry.rideId ? `Trip #${entry.rideId}` : "—")}</Typography>
                    <Typography variant="caption" color="text.secondary">{entry.entryType === "ADJUSTMENT" ? "Adjustment" : "Ride earnings"}</Typography>
                  </Stack>
                </TableCell>
                <TableCell sx={{ minWidth: 170 }}>
                  {entry.status === "APPROVED" ? (
                    <Typography variant="body2" color="text.secondary">Complete</Typography>
                  ) : editingId === entry.id ? (
                    <Stack spacing={1}>
                      <Button size="small" variant="contained" disabled={busyEntryId !== null} onClick={() => void saveEdit(entry.id)}>
                        Submit for approval
                      </Button>
                      <Button size="small" disabled={busyEntryId !== null} onClick={() => setEditingId(null)}>Cancel</Button>
                    </Stack>
                  ) : (
                    <Stack spacing={0.75} alignItems="flex-start">
                      <Button size="small" disabled={busyEntryId !== null} onClick={() => beginEdit(entry)}>
                        {entry.status === "PENDING_CALCULATION" ? "Set amount" : "Edit"}
                      </Button>
                      {entry.status === "PENDING_REVIEW" && (
                        <Button size="small" variant="contained" disabled={busyEntryId !== null} onClick={() => void approve(entry.id)}>
                          Approve
                        </Button>
                      )}
                    </Stack>
                  )}
                </TableCell>
                <TableCell><Chip size="small" label={statusLabels[entry.status]} /></TableCell>
                <TableCell>{entry.billableAmount == null ? "Not issued" : `${entry.currency} ${entry.billableAmount.toFixed(2)}`}</TableCell>
                <TableCell>{entry.earningsRate == null ? "—" : `${entry.earningsRate.toFixed(2)}%`}</TableCell>
                <TableCell>{entry.amount == null ? "Not set" : `${entry.currency} ${entry.amount.toFixed(2)}`}</TableCell>
                <TableCell>
                  {editingId === entry.id ? (
                    <Stack spacing={1} minWidth={220}>
                      <TextField
                        size="small"
                        label="Earnings amount"
                        type="number"
                        required
                        inputProps={{ min: 0, max: 999999.99, step: "0.01" }}
                        value={editAmount}
                        onChange={(event) => setEditAmount(event.target.value)}
                      />
                      <TextField
                        size="small"
                        label="Reason for this amount"
                        required
                        value={editReason}
                        onChange={(event) => setEditReason(event.target.value)}
                      />
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 180, maxWidth: 320, whiteSpace: "normal" }}>
                      {entry.reason ?? "—"}
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {records.length === 0 && (
              <TableRow>
                <TableCell colSpan={8}>
                  <Typography color="text.secondary">No earnings records yet. Completed rides appear here.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </TableContainer>
      </PageCard>
    </Stack>
  );
}
