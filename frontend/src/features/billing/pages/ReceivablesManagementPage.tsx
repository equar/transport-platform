import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import {
  Alert,
  Button,
  MenuItem,
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
import { useNavigate } from "react-router-dom";
import { AdminFilterBar } from "../../../shared/components/AdminFilterBar";
import { EmptyState } from "../../../shared/components/EmptyState";
import { LoadingState } from "../../../shared/components/LoadingState";
import { MetricCard } from "../../../shared/components/MetricCard";
import { PageCard } from "../../../shared/components/PageCard";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { StatusChip } from "../../../shared/components/StatusChip";
import { TableActionButton } from "../../../shared/components/TableActionButton";
import {
  billingApi,
  invoiceAgingBucketOptions,
  type InvoiceAgingBucket,
  type InvoiceSummaryRecord,
  type ReceivablesSummaryRecord,
} from "../api/billingApi";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value || 0);
}

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export function ReceivablesManagementPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<ReceivablesSummaryRecord | null>(null);
  const [items, setItems] = useState<InvoiceSummaryRecord[]>([]);
  const [agingBucket, setAgingBucket] = useState<InvoiceAgingBucket | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadPage() {
    setLoading(true);
    setError(null);
    try {
      const [summaryResponse, invoicesResponse] = await Promise.all([
        billingApi.getReceivablesSummary(),
        billingApi.searchInvoices({
          keyword: "",
          status: "",
          agingBucket,
          billToType: "",
          fromDate: "",
          toDate: "",
          overdueOnly: false,
          page: 0,
          size: 50,
          sortBy: "dueDate",
          sortDirection: "ASC",
        }),
      ]);

      setSummary(summaryResponse);
      setItems(
        invoicesResponse.items.filter(
          (invoice) =>
            invoice.balanceDue > 0 &&
            invoice.status !== "DRAFT" &&
            invoice.status !== "VOID",
        ),
      );
    } catch {
      setError("Receivables data could not be loaded.");
      setSummary(null);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPage();
  }, [agingBucket]);

  return (
    <Stack spacing={3}>
      <SectionHeader
        eyebrow="Billing"
        title="Receivables and Aging"
        description="Track collected cash, aging buckets, and overdue invoice exposure while keeping follow-up work anchored to the invoice record."
      >
        <Button
          variant="outlined"
          startIcon={<RefreshRoundedIcon />}
          onClick={() => void loadPage()}
        >
          Refresh
        </Button>
      </SectionHeader>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {loading || !summary ? (
        <LoadingState />
      ) : (
        <>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <MetricCard
              icon={<AttachMoneyRoundedIcon color="primary" />}
              label="Collected Amount"
              value={formatCurrency(summary.totalCollectedAmount)}
              caption="All non-void, non-failed recorded payments."
            />
            <MetricCard
              icon={<ReceiptLongRoundedIcon color="primary" />}
              label="Outstanding Balance"
              value={formatCurrency(summary.outstandingBalance)}
              caption="Current balance due across receivable invoices."
            />
            <MetricCard
              icon={<WarningAmberRoundedIcon color="primary" />}
              label="Overdue Amount"
              value={formatCurrency(summary.overdueAmount)}
              caption={`${summary.overdueInvoiceCount} overdue invoices currently require follow-up.`}
            />
            <MetricCard
              icon={<ReceiptLongRoundedIcon color="primary" />}
              label="Partially Paid Invoices"
              value={summary.partiallyPaidInvoiceCount}
              caption="Invoices carrying both a payment history and remaining balance."
            />
          </Stack>

          <PageCard>
            <Stack spacing={2}>
              <Typography variant="h5">Aging Buckets</Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                {summary.agingBuckets.map((bucket) => (
                  <PageCard key={bucket.bucket} sx={{ flex: 1, p: 3 }}>
                    <Stack spacing={1}>
                      <StatusChip value={bucket.bucket} />
                      <Typography variant="h5">
                        {formatCurrency(bucket.amount)}
                      </Typography>
                      <Typography color="text.secondary">
                        {bucket.invoiceCount} invoice
                        {bucket.invoiceCount === 1 ? "" : "s"}
                      </Typography>
                    </Stack>
                  </PageCard>
                ))}
              </Stack>
            </Stack>
          </PageCard>

          <AdminFilterBar>
            <TextField
              select
              label="Aging Bucket"
              value={agingBucket}
              onChange={(event) =>
                setAgingBucket(event.target.value as InvoiceAgingBucket | "")
              }
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="">All Open Receivables</MenuItem>
              {invoiceAgingBucketOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option.replaceAll("_", " ")}
                </MenuItem>
              ))}
            </TextField>
          </AdminFilterBar>

          <PageCard sx={{ p: 0 }}>
            {items.length === 0 ? (
              <EmptyState
                title="No records found"
                description="Open receivable invoices will appear here when they meet the selected aging criteria."
              />
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice</TableCell>
                    <TableCell>Bill-to</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Balance Due</TableCell>
                    <TableCell>Days Past Due</TableCell>
                    <TableCell>Aging Bucket</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((invoice) => (
                    <TableRow key={invoice.id} hover>
                      <TableCell>{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.billToNameSnapshot}</TableCell>
                      <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                      <TableCell>
                        {formatCurrency(invoice.balanceDue)}
                      </TableCell>
                      <TableCell>{invoice.daysPastDue ?? 0}</TableCell>
                      <TableCell>
                        {invoice.agingBucket ? (
                          <StatusChip value={invoice.agingBucket} />
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusChip value={invoice.status} />
                      </TableCell>
                      <TableCell align="right">
                        <TableActionButton
                          title="View Invoice"
                          onClick={() =>
                            navigate(`/company/invoices/${invoice.id}`)
                          }
                        >
                          <VisibilityRoundedIcon />
                        </TableActionButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </PageCard>
        </>
      )}
    </Stack>
  );
}
