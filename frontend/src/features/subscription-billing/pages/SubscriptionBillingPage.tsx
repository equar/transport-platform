import { SubscriptionAdjustments } from "../components/SubscriptionAdjustments";
import type { SubscriptionAdjustment } from "../api/subscriptionBillingApi";
import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../../auth/context/AuthContext";
import { isPlatformAdmin } from "../../auth/access";
import {
  subscriptionBillingApi as api,
  type BillingAccount,
  type BillingConfiguration,
  type SubscriptionInvoice,
  type BillingPayment,
} from "../api/subscriptionBillingApi";
import { PageCard } from "../../../shared/components/PageCard";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { StatusChip } from "../../../shared/components/StatusChip";
import { getApiErrorMessage } from "../../../shared/api/client";
import { formatDateTime } from "../../../shared/utils/format";
const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    value,
  );
export function SubscriptionBillingPage() {
  const { session } = useAuth();
  const platform = isPlatformAdmin(session);
  const [accounts, setAccounts] = useState<BillingAccount[]>([]),
    [invoices, setInvoices] = useState<SubscriptionInvoice[]>([]);
  const [accountPage, setAccountPage] = useState(0),
    [invoicePage, setInvoicePage] = useState(0),
    [accountTotal, setAccountTotal] = useState(0),
    [invoiceTotal, setInvoiceTotal] = useState(0);
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null),
    [notice, setNotice] = useState<string | null>(null),
    [refresh, setRefresh] = useState(0);
  const [editing, setEditing] = useState<BillingAccount | null>(null),
    [rate, setRate] = useState(""),
    [start, setStart] = useState(""),
    [due, setDue] = useState("14"),
    [mode, setMode] = useState<"MANUAL" | "AUTOMATIC">("MANUAL"),
    [enabled, setEnabled] = useState(false);
  const [detail, setDetail] = useState<{
    invoice: SubscriptionInvoice;
    payments: BillingPayment[];
    adjustments?: SubscriptionAdjustment[];
  } | null>(null);
  const [paying, setPaying] = useState<SubscriptionInvoice | null>(null),
    [amount, setAmount] = useState(""),
    [reference, setReference] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void Promise.all([
      api.accounts(platform, accountPage, 10),
      api.invoices(platform, invoicePage, 10),
    ])
      .then(([a, i]) => {
        if (active) {
          setAccounts(a.items);
          setAccountTotal(a.totalElements);
          setInvoices(i.items);
          setInvoiceTotal(i.totalElements);
        }
      })
      .catch((cause) => {
        if (active) {
          setAccounts([]);
          setInvoices([]);
          setError(
            getApiErrorMessage(
              cause,
              "Subscription billing could not be loaded.",
            ),
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [platform, accountPage, invoicePage, refresh]);
  async function action(work: () => Promise<unknown>, success: string) {
    setBusy(true);
    setError(null);
    try {
      const result = await work();
      if (result === false) return false;
      setNotice(success);
      setRefresh((v) => v + 1);
      return true;
    } catch (cause) {
      setError(
        getApiErrorMessage(cause, "The billing action could not be completed."),
      );
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function viewInvoice(id: number) {
    setBusy(true);
    setError(null);
    try {
      setDetail(await api.detail(platform, id));
    } catch (cause) {
      setError(getApiErrorMessage(cause, "The invoice could not be loaded."));
    } finally {
      setBusy(false);
    }
  }
  function edit(a: BillingAccount) {
    setEditing(a);
    setRate(a.monthlyDriverRate == null ? "" : String(a.monthlyDriverRate));
    setStart(a.firstRenewalDate ?? new Date().toISOString().slice(0, 10));
    setDue(String(a.paymentDueDays));
    setMode(a.collectionMode);
    setEnabled(a.enabled);
    setError(null);
  }
  async function save() {
    if (!editing) return;
    if (
      !/^\d{1,10}(\.\d{1,2})?$/.test(rate) ||
      !start ||
      !/^\d+$/.test(due) ||
      Number(due) > 90
    ) {
      setError(
        "Enter a valid USD rate, renewal date and payment term from 0 to 90 days.",
      );
      return;
    }
    const payload: BillingConfiguration = {
      monthlyDriverRate: Number(rate),
      firstRenewalDate: start,
      paymentDueDays: Number(due),
      collectionMode: mode,
      enabled,
    };
    if (
      await action(
        () => api.configure(editing.subscriptionId, payload),
        "Subscription billing configuration saved.",
      )
    )
      setEditing(null);
  }
  async function record() {
    if (!paying) return;
    if (
      !/^\d{1,12}(\.\d{1,2})?$/.test(amount) ||
      Number(amount) <= 0 ||
      !reference.trim()
    ) {
      setError("Enter a positive USD payment and a unique payment reference.");
      return;
    }
    if (
      await action(
        () => api.payment(paying.id, Number(amount), reference.trim()),
        "Payment recorded.",
      )
    )
      setPaying(null);
  }
  return (
    <Stack spacing={3}>
      {session?.identity.subscriptionRecovery && <Alert severity="warning">Subscription payment is overdue. You can review invoices here while other workspace features are restricted. Contact the platform administrator to arrange payment. Sign in again after the overdue balance is settled.</Alert>}
      <SectionHeader
        eyebrow={
          platform ? "Platform administration" : "Company administration"
        }
        title="Platform Subscription Billing"
        description="Bakaroo platform fees: active drivers counted at monthly renewal × the configured USD rate. These are separate from transport-service invoices."
      >
        <Stack direction="row" gap={1}>
          <Button
            disabled={loading || busy}
            onClick={() => setRefresh((v) => v + 1)}
          >
            Refresh
          </Button>
          {platform ? (
            <Button component={RouterLink} to="/platform/tenant-subscriptions">
              Manage subscriptions
            </Button>
          ) : null}
        </Stack>
      </SectionHeader>
      {error ? (
        <Alert
          severity="error"
          action={
            !editing && !paying ? (
              <Button onClick={() => setRefresh((v) => v + 1)}>Retry</Button>
            ) : undefined
          }
        >
          {error}
        </Alert>
      ) : null}
      {notice ? (
        <Alert severity="success" onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      ) : null}
      <PageCard>
        <Stack spacing={2}>
          <Typography variant="h5">Subscription accounts</Typography>
          {loading ? (
            <Typography role="status">Loading subscription billing…</Typography>
          ) : !accounts.length ? (
            <Typography>
              No subscription account found.{" "}
              {platform
                ? "Select an active plan when provisioning the company, or create its subscription."
                : "Contact Bakaroo support."}
            </Typography>
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Company / Plan</TableCell>
                    <TableCell>Driver pricing</TableCell>
                    <TableCell>Next renewal</TableCell>
                    <TableCell>Billing</TableCell>
                    {platform ? <TableCell>Actions</TableCell> : null}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {accounts.map((a) => (
                    <TableRow key={a.subscriptionId}>
                      <TableCell>
                        {a.tenantName}
                        <Typography variant="body2">
                          {a.planCode} · #{a.subscriptionId} ·{" "}
                          {a.subscriptionStatus}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {a.monthlyDriverRate == null
                          ? "Rate not configured"
                          : `${money(a.monthlyDriverRate)} / active driver / month`}
                        <Typography variant="body2">
                          Active now: {a.activeDrivers}. Final count captured at
                          renewal.
                        </Typography>
                        {a.pendingRateDate ? (
                          <Typography variant="body2">
                            New rate applies {a.pendingRateDate}; issued
                            invoices retain their rate.
                          </Typography>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        {a.nextRenewalAt
                          ? formatDateTime(a.nextRenewalAt)
                          : "Not scheduled"}
                      </TableCell>
                      <TableCell>
                        <StatusChip value={a.enabled ? "ACTIVE" : "INACTIVE"} />
                        <Typography variant="body2">
                          {a.collectionMode === "MANUAL"
                            ? "Manual payments"
                            : "Automatic collection"}
                        </Typography>
                      </TableCell>
                      {platform ? (
                        <TableCell>
                          <Stack gap={1}>
                            <Button disabled={busy} onClick={() => edit(a)}>
                              Configure billing
                            </Button>
                            <Button
                              disabled={busy || !a.enabled}
                              onClick={() =>
                                void action(async () => {
                                  const i = await api.generate(
                                    a.subscriptionId,
                                  );
                                  if (!i)
                                    throw new Error(
                                      "No renewal is due, or the company/subscription is not active.",
                                    );
                                }, "Due renewal invoice generated.")
                              }
                            >
                              Generate due renewal
                            </Button>
                          </Stack>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
          <TablePagination
            component="div"
            count={accountTotal}
            page={accountPage}
            rowsPerPage={10}
            rowsPerPageOptions={[10]}
            onPageChange={(_, p) => setAccountPage(p)}
          />
        </Stack>
      </PageCard>
      <PageCard>
        <Stack spacing={2}>
          <Typography variant="h5">Subscription invoices</Typography>
          {!loading && !invoices.length ? (
            <Typography>No subscription invoices recorded.</Typography>
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice / Company</TableCell>
                    <TableCell>Period</TableCell>
                    <TableCell>Driver count × rate</TableCell>
                    <TableCell>Total / Balance</TableCell>
                    <TableCell>Status / Due</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell>
                        SUB-{i.id}
                        <Typography variant="body2">{i.tenantName}</Typography>
                      </TableCell>
                      <TableCell>
                        {i.periodStart} to {i.periodEnd} (end exclusive)
                      </TableCell>
                      <TableCell>
                        {i.driverCount} × {money(i.monthlyDriverRate)}
                      </TableCell>
                      <TableCell>
                        {money(i.amount)}
                        <Typography variant="body2">
                          Balance: {money(i.amount - i.paidAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <StatusChip value={i.status} />
                        <Typography variant="body2">Due {i.dueDate}</Typography>
                        {i.collectionMode === "AUTOMATIC" &&
                        i.collectionState !== "NOT_ATTEMPTED" ? (
                          <Typography variant="body2">
                            Collection:{" "}
                            {i.collectionState
                              .replaceAll("_", " ")
                              .toLowerCase()}
                            {i.status !== "PAID"
                              ? ". Reconcile before recording a manual payment."
                              : ""}
                          </Typography>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Stack gap={1}>
                          <Button
                            disabled={busy}
                            onClick={() => void viewInvoice(i.id)}
                          >
                            View invoice
                          </Button>
                          {platform && i.status !== "PAID" && ["PENDING", "REVIEW_REQUIRED"].includes(i.collectionState) && (
                            <Button disabled={busy} onClick={() => void action(async () => {
                              const result = await api.reconcile(i.id);
                              if (result.status !== "PAID" && result.collectionState !== "NOT_ATTEMPTED") {
                                setError("Collection is still pending. Contact support; do not record another payment.");
                                return false;
                              }
                            }, "Payment provider reconciliation completed.")}>Reconcile payment</Button>
                          )}
                          {platform && i.status !== "PAID" ? (
                            <Button
                              disabled={
                                busy ||
                                (i.collectionMode === "AUTOMATIC" &&
                                  i.collectionState !== "NOT_ATTEMPTED")
                              }
                              onClick={() => {
                                setPaying(i);
                                setAmount((i.amount - i.paidAmount).toFixed(2));
                                setReference("");
                                setError(null);
                              }}
                            >
                              Record payment
                            </Button>
                          ) : null}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
          <TablePagination
            component="div"
            count={invoiceTotal}
            page={invoicePage}
            rowsPerPage={10}
            rowsPerPageOptions={[10]}
            onPageChange={(_, p) => setInvoicePage(p)}
          />
        </Stack>
      </PageCard>
      <Dialog
        open={!!editing}
        onClose={busy ? undefined : () => setEditing(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Configure per-driver billing · {editing?.tenantName}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 2 }}>
            {error ? <Alert severity="error">{error}</Alert> : null}
            <Alert severity="info">
              Active drivers are counted at each renewal. Mid-cycle driver
              changes apply at the next renewal; there is no proration. USD
              only. Issued invoices are unchanged by price edits.
            </Alert>
            <TextField
              label="Monthly price per active driver (USD)"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              inputProps={{ inputMode: "decimal" }}
              disabled={busy}
            />
            <TextField
              label="First renewal date (UTC)"
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={busy || !!editing?.firstRenewalDate}
              helperText="For a date of today, the initial count is captured when billing is configured. Future dates start at midnight UTC."
            />
            <TextField
              label="Payment due after (days)"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              disabled={busy}
              inputProps={{ inputMode: "numeric" }}
            />
            <TextField
              select
              label="Collection mode"
              value={mode}
              onChange={(e) => setMode(e.target.value as typeof mode)}
              disabled={busy}
            >
              <MenuItem value="MANUAL">Manual</MenuItem>
              <MenuItem
                value="AUTOMATIC"
                disabled={!editing?.automaticAvailable}
              >
                Automatic
              </MenuItem>
            </TextField>
            {!editing?.automaticAvailable ? (
              <Typography variant="body2">
                Record subscription payments manually. Automatic collection is unavailable.
              </Typography>
            ) : null}
            <FormControlLabel
              label="Enable scheduled monthly invoicing"
              control={
                <Checkbox
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  disabled={busy}
                />
              }
            />
            <Typography variant="body2">
              Pausing invoice generation does not waive pending renewal periods.
              Resume can generate deferred invoices. Replace or cancel the
              subscription to end its contract.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={busy} onClick={() => setEditing(null)}>
            Cancel
          </Button>
          <Button
            disabled={busy}
            variant="contained"
            onClick={() => void save()}
          >
            Save billing configuration
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={!!paying}
        onClose={busy ? undefined : () => setPaying(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Record received payment · SUB-{paying?.id}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 2 }}>
            {error ? <Alert severity="error">{error}</Alert> : null}
            <Typography>
              Record funds already received by Bakaroo. This does not charge a
              card or bank account.
            </Typography>
            <TextField
              label="Amount received (USD)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={busy}
            />
            <TextField
              label="Unique payment reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              inputProps={{ maxLength: 150 }}
              disabled={busy}
              helperText="Bank/receipt reference. Repeating the same reference does not record it twice."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={busy} onClick={() => setPaying(null)}>
            Cancel
          </Button>
          <Button
            disabled={busy}
            variant="contained"
            onClick={() => void record()}
          >
            Record received payment
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={!!detail}
        onClose={() => setDetail(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Subscription invoice SUB-{detail?.invoice.id}</DialogTitle>
        <DialogContent>
          {detail ? (
            <Stack spacing={2} sx={{ pt: 2 }}>
              <Typography variant="h5">
                Bakaroo platform subscription · {detail.invoice.tenantName}
              </Typography>
              <Typography>
                {detail.invoice.planCode} · {detail.invoice.periodStart} to{" "}
                {detail.invoice.periodEnd} (end exclusive)
              </Typography>
              <Typography>
                Metered at {formatDateTime(detail.invoice.meteredAt)}:{" "}
                {detail.invoice.driverCount} active drivers ×{" "}
                {money(detail.invoice.monthlyDriverRate)} ={" "}
                {money(detail.invoice.originalAmount ?? detail.invoice.amount)}
              </Typography>
              <Typography>
                Driver record IDs counted: {detail.invoice.driverIdsJson}
              </Typography>
              <Typography>
                Paid: {money(detail.invoice.paidAmount)} · Outstanding:{" "}
                {money(detail.invoice.amount - detail.invoice.paidAmount)} ·
                Due: {detail.invoice.dueDate}
              </Typography>
              <StatusChip value={detail.invoice.status} />
              <SubscriptionAdjustments key={detail.invoice.id} invoice={detail.invoice} payments={detail.payments} adjustments={detail.adjustments}
                editable={platform} onChanged={async () => { await viewInvoice(detail.invoice.id); setRefresh(v => v + 1); }} />
              <Typography variant="h6">Payment history</Typography>
              {detail.payments.length ? (
                detail.payments.map((p) => (
                  <Typography key={p.id}>
                    {formatDateTime(p.recordedAt)} · {money(p.amount)} ·{" "}
                    {p.source} · {p.paymentReference} · {p.recordedBy}
                  </Typography>
                ))
              ) : (
                <Typography>No payments recorded.</Typography>
              )}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetail(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
