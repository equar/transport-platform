import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PublishRoundedIcon from "@mui/icons-material/PublishRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import {
  Alert,
  Button,
  Checkbox,
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
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminFilterBar } from "../../../shared/components/AdminFilterBar";
import { ConfirmDialog } from "../../../shared/components/ConfirmDialog";
import { EmptyState } from "../../../shared/components/EmptyState";
import { LoadingState } from "../../../shared/components/LoadingState";
import { PageCard } from "../../../shared/components/PageCard";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { StatusChip } from "../../../shared/components/StatusChip";
import { TableActionButton } from "../../../shared/components/TableActionButton";
import { formatDateTime } from "../../../shared/utils/format";
import { useToast } from "../../../shared/providers/ToastProvider";
import {
  billingApi,
  billToTypeOptions,
  invoiceAgingBucketOptions,
  invoiceStatusOptions,
  type BillToType,
  type InvoiceAgingBucket,
  type InvoicePayload,
  type InvoiceRecord,
  type InvoiceStatus,
  type InvoiceSummaryRecord,
} from "../api/billingApi";
import { InvoiceGenerationDialog } from "../components/InvoiceGenerationDialog";
import { InvoiceUpsertDialog } from "../components/InvoiceUpsertDialog";

type InvoiceAction = "issue" | "void";

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
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

export function InvoiceManagementPage() {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [items, setItems] = useState<InvoiceSummaryRecord[]>([]);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<InvoiceStatus | "">("");
  const [agingBucket, setAgingBucket] = useState<InvoiceAgingBucket | "">("");
  const [billToType, setBillToType] = useState<BillToType | "">("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generationDialogOpen, setGenerationDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [actionState, setActionState] = useState<{
    type: InvoiceAction;
    invoice: InvoiceSummaryRecord;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [voidReason, setVoidReason] = useState("");

  async function loadInvoices() {
    setLoading(true);
    setError(null);
    try {
      const response = await billingApi.searchInvoices({
        keyword,
        status,
        agingBucket,
        billToType,
        fromDate,
        toDate,
        overdueOnly,
        page,
        size,
        sortBy: "updatedAt",
        sortDirection: "DESC",
      });
      setItems(response.items);
      setTotal(response.totalElements);
    } catch {
      setError("Invoices could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadInvoices();
  }, [
    agingBucket,
    billToType,
    fromDate,
    keyword,
    overdueOnly,
    page,
    size,
    status,
    toDate,
  ]);

  async function handleOpenEdit(invoiceId: number) {
    try {
      const response = await billingApi.getInvoice(invoiceId);
      setSelectedInvoice(response);
      setDialogOpen(true);
    } catch {
      showError("Invoice details could not be loaded.");
    }
  }

  async function handleSubmit(payload: InvoicePayload) {
    setSaving(true);
    try {
      if (selectedInvoice) {
        await billingApi.updateInvoice(selectedInvoice.id, payload);
        showSuccess("Invoice updated successfully.");
      } else {
        await billingApi.createInvoice(payload);
        showSuccess("Invoice created successfully.");
      }
      setDialogOpen(false);
      setSelectedInvoice(null);
      await loadInvoices();
    } catch {
      showError("Invoice changes could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function handleActionConfirm() {
    if (!actionState) {
      return;
    }
    if (actionState.type === "void" && !voidReason.trim()) {
      showError("A void reason is required.");
      return;
    }

    setActionLoading(true);
    try {
      if (actionState.type === "issue") {
        await billingApi.issueInvoice(actionState.invoice.id);
      } else {
        await billingApi.voidInvoice(actionState.invoice.id, voidReason.trim());
      }
      showSuccess("Invoice status updated successfully.");
      setActionState(null);
      setVoidReason("");
      await loadInvoices();
    } catch {
      showError("The invoice action could not be completed.");
    } finally {
      setActionLoading(false);
    }
  }

  function renderActions(invoice: InvoiceSummaryRecord) {
    return (
      <>
        <TableActionButton
          title="View Details"
          onClick={() => navigate(`/company/invoices/${invoice.id}`)}
        >
          <VisibilityRoundedIcon />
        </TableActionButton>
        {invoice.status === "DRAFT" && (
          <>
            <TableActionButton
              title="Edit Invoice"
              onClick={() => void handleOpenEdit(invoice.id)}
            >
              <EditRoundedIcon />
            </TableActionButton>
            <TableActionButton
              title="Issue Invoice"
              onClick={() => setActionState({ type: "issue", invoice })}
            >
              <PublishRoundedIcon />
            </TableActionButton>
          </>
        )}
        {(invoice.status === "ISSUED" || invoice.status === "OVERDUE") && (
          <TableActionButton
            title="Void Invoice"
            onClick={() => {
              setVoidReason("");
              setActionState({ type: "void", invoice });
            }}
          >
            <BlockRoundedIcon />
          </TableActionButton>
        )}
      </>
    );
  }

  return (
    <Stack spacing={3}>
      <SectionHeader
        eyebrow="Batch 5A"
        title="Invoice Management"
        description="Manage draft and issued invoices, generate tenant-scoped billing drafts, and monitor outstanding balances with practical first-version invoice workflows."
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<ReceiptLongRoundedIcon />}
            onClick={() => setGenerationDialogOpen(true)}
          >
            Generate Invoice
          </Button>
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => {
              setSelectedInvoice(null);
              setDialogOpen(true);
            }}
          >
            Create Invoice
          </Button>
        </Stack>
      </SectionHeader>

      <AdminFilterBar>
        <TextField
          label="Search"
          placeholder="Search by invoice number or bill-to"
          value={keyword}
          onChange={(event) => {
            setPage(0);
            setKeyword(event.target.value);
          }}
          fullWidth
        />
        <TextField
          select
          label="Status"
          value={status}
          onChange={(event) => {
            setPage(0);
            setStatus(event.target.value as InvoiceStatus | "");
          }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All Statuses</MenuItem>
          {invoiceStatusOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option.replaceAll("_", " ")}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Aging Bucket"
          value={agingBucket}
          onChange={(event) => {
            setPage(0);
            setAgingBucket(event.target.value as InvoiceAgingBucket | "");
          }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All Aging Buckets</MenuItem>
          {invoiceAgingBucketOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option.replaceAll("_", " ")}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Bill-to Type"
          value={billToType}
          onChange={(event) => {
            setPage(0);
            setBillToType(event.target.value as BillToType | "");
          }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All Bill-to Types</MenuItem>
          {billToTypeOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option.replaceAll("_", " ")}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="From Date"
          type="date"
          value={fromDate}
          onChange={(event) => {
            setPage(0);
            setFromDate(event.target.value);
          }}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 170 }}
        />
        <TextField
          label="To Date"
          type="date"
          value={toDate}
          onChange={(event) => {
            setPage(0);
            setToDate(event.target.value);
          }}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 170 }}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={overdueOnly}
              onChange={(event) => {
                setPage(0);
                setOverdueOnly(event.target.checked);
              }}
            />
          }
          label="Overdue Only"
          sx={{ ml: 1 }}
        />
      </AdminFilterBar>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <PageCard sx={{ p: 0 }}>
        {loading ? (
          <LoadingState />
        ) : items.length === 0 ? (
          <EmptyState
            title="No records found"
            description="Invoices will appear here after you create a draft or generate a billing preview into an invoice."
          />
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Invoice Number</TableCell>
                  <TableCell>Bill-to Type</TableCell>
                  <TableCell>Bill-to</TableCell>
                  <TableCell>Invoice Date</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Total Amount</TableCell>
                  <TableCell>Balance Due</TableCell>
                  <TableCell>Aging</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Updated</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((invoice) => (
                  <TableRow key={invoice.id} hover>
                    <TableCell>{invoice.invoiceNumber}</TableCell>
                    <TableCell>
                      <StatusChip value={invoice.billToType} />
                    </TableCell>
                    <TableCell>{invoice.billToNameSnapshot}</TableCell>
                    <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell>
                      {formatCurrency(invoice.totalAmount, invoice.currency)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(invoice.balanceDue, invoice.currency)}
                    </TableCell>
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
                    <TableCell>{formatDateTime(invoice.updatedAt)}</TableCell>
                    <TableCell align="right">
                      {renderActions(invoice)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_, nextPage) => setPage(nextPage)}
              rowsPerPage={size}
              onRowsPerPageChange={(event) => {
                setPage(0);
                setSize(Number(event.target.value));
              }}
              rowsPerPageOptions={[10, 25, 50]}
            />
          </>
        )}
      </PageCard>

      <InvoiceUpsertDialog
        open={dialogOpen}
        invoice={selectedInvoice}
        loading={saving}
        onClose={() => {
          setDialogOpen(false);
          setSelectedInvoice(null);
        }}
        onSubmit={handleSubmit}
      />

      <InvoiceGenerationDialog
        open={generationDialogOpen}
        loading={false}
        onClose={() => setGenerationDialogOpen(false)}
        onGenerated={(invoiceId) => {
          setGenerationDialogOpen(false);
          showSuccess("Invoice generated successfully.");
          void loadInvoices();
          navigate(`/company/invoices/${invoiceId}`);
        }}
      />

      <ConfirmDialog
        open={Boolean(actionState)}
        title={actionState?.type === "issue" ? "Issue Invoice" : "Void Invoice"}
        description={
          actionState?.type === "issue"
            ? `Issue ${actionState.invoice.invoiceNumber} so it is visible as an active receivable.`
            : `Void ${actionState?.invoice.invoiceNumber} and preserve the audit trail for this billing action.`
        }
        confirmLabel={
          actionState?.type === "issue" ? "Issue Invoice" : "Void Invoice"
        }
        loading={actionLoading}
        onCancel={() => {
          setActionState(null);
          setVoidReason("");
        }}
        onConfirm={handleActionConfirm}
      >
        {actionState?.type === "void" ? (
          <TextField
            label="Void Reason"
            value={voidReason}
            onChange={(event) => setVoidReason(event.target.value)}
            multiline
            minRows={2}
            sx={{ mt: 2 }}
            fullWidth
          />
        ) : null}
      </ConfirmDialog>
    </Stack>
  );
}
