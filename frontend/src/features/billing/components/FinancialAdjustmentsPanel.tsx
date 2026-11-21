import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  apiClient,
  getApiErrorMessage,
  unwrapResponse,
} from "../../../shared/api/client";
import { postFinancialAdjustment } from "../../../shared/api/financialIntent";
import { PageCard } from "../../../shared/components/PageCard";
interface Credit {
  id: number;
  number: string;
  amount: number;
  availableAmount: number;
  usedAmount: number;
  status: string;
  currency: string;
  reason: string;
}
interface Refund {
  id: number;
  amount: number;
  currency: string;
  reference: string;
  reason: string;
}
export function FinancialAdjustmentsPanel({
  invoiceId,
  paymentId,
  currency,
  maximum,
  outstanding,
  onChanged,
  allowCreate = true,
  allowApply = true,
}: {
  invoiceId?: number;
  paymentId?: number;
  currency: string;
  maximum?: number;
  outstanding?: number;
  allowCreate?: boolean;
  allowApply?: boolean;
  onChanged: () => void;
}) {
  const [credits, setCredits] = useState<Credit[]>([]),
    [available, setAvailable] = useState<Credit[]>([]),
    [refunds, setRefunds] = useState<Refund[]>([]);
  const [amount, setAmount] = useState(""),
    [reason, setReason] = useState(""),
    [reference, setReference] = useState(""),
    [selected, setSelected] = useState(""),
    [applyAmount, setApplyAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null),
    [notice, setNotice] = useState(""),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    const load = async () => {
      try {
        if (paymentId) {
          const r = await apiClient.get(
            `/company/payments/${paymentId}/refunds`,
          );
          if (active) setRefunds(unwrapResponse<Refund[]>(r.data));
        } else if (invoiceId) {
          const [a, b] = await Promise.all([
            apiClient.get(`/company/invoices/${invoiceId}/credit-notes`),
            apiClient.get(
              `/company/invoices/${invoiceId}/credit-notes?available=true`,
            ),
          ]);
          if (active) {
            setCredits(unwrapResponse<Credit[]>(a.data));
            setAvailable(unwrapResponse<Credit[]>(b.data));
          }
        }
      } catch (e) {
        if (active)
          setError(
            getApiErrorMessage(
              e,
              "Financial adjustment history could not be loaded.",
            ),
          );
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [invoiceId, paymentId, revision]);
  const remaining =
    maximum === undefined
      ? undefined
      : Math.max(
          0,
          maximum -
            (paymentId
              ? 0
              : credits
                  .filter((note) => note.status === "ISSUED")
                  .reduce((sum, note) => sum + note.amount, 0)),
        );
  const selectedCredit = available.find((note) => String(note.id) === selected);
  const applicationMaximum = Math.min(
    selectedCredit?.availableAmount ?? 0,
    outstanding ?? Infinity,
  );
  function valid(value: string) {
    return /^\d+(\.\d{1,2})?$/.test(value) && Number(value) > 0;
  }
  async function perform(path: string, payload: unknown) {
    setBusy(true);
    setError(null);
    setNotice("");
    try {
      await postFinancialAdjustment(path, payload);
      setNotice("Financial adjustment recorded.");
      setAmount("");
      setReason("");
      setReference("");
      setApplyAmount("");
      setSelected("");
      setRevision((n) => n + 1);
      onChanged();
    } catch (e) {
      setError(
        getApiErrorMessage(
          e,
          "The adjustment could not be recorded. Retry unchanged details if the result is uncertain.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <PageCard>
      <Stack spacing={2}>
        <Typography variant="h5">
          {paymentId ? "Refunds" : "Credit notes"}
        </Typography>
        {error ? <Alert severity="error">{error}</Alert> : null}
        {notice ? <Alert severity="success">{notice}</Alert> : null}
        <Alert severity="info">
          {paymentId
            ? "Record a refund only after money has been returned. No bank transfer is initiated here. The invoice balance will reopen by the refunded amount."
            : "Issue credit for a future invoice for this same bill-to account and currency. This does not reduce the source invoice or refund cash."}
        </Alert>
        {loading ? (
          <CircularProgress size={24} aria-label="Loading financial history" />
        ) : null}
        {remaining !== undefined ? (
          <Typography variant="body2">
            Available to {paymentId ? "refund" : "issue as credit"}:{" "}
            {remaining.toFixed(2)} {currency}
          </Typography>
        ) : null}
        <TextField
          label={`Amount (${currency})`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputProps={{ inputMode: "decimal" }}
          disabled={busy || loading || !allowCreate}
        />
        <TextField
          label="Reason for the adjustment or unused-credit void"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          inputProps={{ maxLength: 1000 }}
          disabled={busy || loading || !allowCreate}
        />
        {paymentId ? (
          <TextField
            label="Actual refund / cash-return reference"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            inputProps={{ maxLength: 150 }}
            disabled={busy || loading || !allowCreate}
          />
        ) : null}
        <Button
          variant="contained"
          disabled={
            busy ||
            loading ||
            !allowCreate ||
            !valid(amount) ||
            (remaining !== undefined &&
              Number(amount) > remaining + 0.000001) ||
            !reason.trim() ||
            (!!paymentId && !reference.trim())
          }
          onClick={() =>
            void perform(
              paymentId
                ? `/company/payments/${paymentId}/refunds`
                : `/company/invoices/${invoiceId}/credit-notes`,
              {
                amount: Number(amount),
                reason: reason.trim(),
                ...(paymentId ? { reference: reference.trim() } : {}),
              },
            )
          }
        >
          {busy
            ? "Recording…"
            : paymentId
              ? "Record returned money"
              : "Issue future-invoice credit"}
        </Button>
        {refunds.map((row) => (
          <Alert key={row.id} severity="info">
            Refund #{row.id}: {row.amount.toFixed(2)} {row.currency} ·
            Reference: {row.reference} · {row.reason}
          </Alert>
        ))}
        {credits.map((row) => (
          <Stack
            key={row.id}
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
          >
            <Typography>
              {row.number}: {row.amount.toFixed(2)} {row.currency} ·{" "}
              {row.status} · Available {row.availableAmount.toFixed(2)} ·{" "}
              {row.reason}
            </Typography>
            {row.status === "ISSUED" && row.usedAmount === 0 ? (
              <Button
                color="error"
                disabled={busy || !reason.trim()}
                onClick={() =>
                  void perform(`/company/credit-notes/${row.id}/void`, {
                    reason: reason.trim(),
                  })
                }
              >
                Void unused credit
              </Button>
            ) : null}
          </Stack>
        ))}
        {invoiceId && allowApply && available.length > 0 ? (
          <>
            <Typography variant="h6">
              Apply an existing credit to this invoice
            </Typography>
            <TextField
              select
              label="Available credit"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              disabled={busy || loading || !allowCreate}
            >
              {available.map((note) => (
                <MenuItem key={note.id} value={String(note.id)}>
                  {note.number} — {note.availableAmount.toFixed(2)}{" "}
                  {note.currency}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label={`Credit to apply (${currency})`}
              value={applyAmount}
              onChange={(e) => setApplyAmount(e.target.value)}
              inputProps={{ inputMode: "decimal" }}
              disabled={busy || loading || !allowCreate}
            />
            <Button
              disabled={
                busy ||
                loading ||
                !allowApply ||
                !selected ||
                !valid(applyAmount) ||
                Number(applyAmount) > applicationMaximum + 0.000001
              }
              onClick={() =>
                void perform(`/company/credit-notes/${selected}/apply`, {
                  invoiceId,
                  amount: Number(applyAmount),
                })
              }
            >
              Apply credit
            </Button>
          </>
        ) : null}
      </Stack>
    </PageCard>
  );
}
