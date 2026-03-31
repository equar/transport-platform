import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import {
  Alert,
  Button,
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
import { EmptyState } from "../../../shared/components/EmptyState";
import { LoadingState } from "../../../shared/components/LoadingState";
import { PageCard } from "../../../shared/components/PageCard";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { StatusChip } from "../../../shared/components/StatusChip";
import { TableActionButton } from "../../../shared/components/TableActionButton";
import { useToast } from "../../../shared/providers/ToastProvider";
import { formatDateTime } from "../../../shared/utils/format";
import {
  billingApi,
  paymentMethodOptions,
  paymentStatusOptions,
  type PaymentMethod,
  type PaymentPayload,
  type PaymentRecord,
  type PaymentStatus,
  type PaymentSummaryRecord,
} from "../api/billingApi";
import { PaymentUpsertDialog } from "../components/PaymentUpsertDialog";

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

export function PaymentManagementPage() {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [items, setItems] = useState<PaymentSummaryRecord[]>([]);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<PaymentStatus | "">("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  async function loadPayments() {
    setLoading(true);
    setError(null);
    try {
      const response = await billingApi.searchPayments({
        keyword,
        status,
        paymentMethod,
        fromDate,
        toDate,
        page,
        size,
        sortBy: "updatedAt",
        sortDirection: "DESC",
      });
      setItems(response.items);
      setTotal(response.totalElements);
    } catch {
      setError("Payments could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPayments();
  }, [fromDate, keyword, page, paymentMethod, size, status, toDate]);

  async function handleOpenEdit(paymentId: number) {
    try {
      const response = await billingApi.getPayment(paymentId);
      setSelectedPayment(response);
      setDialogOpen(true);
    } catch {
      showError("Payment details could not be loaded.");
    }
  }

  async function handleSubmit(payload: PaymentPayload) {
    setSaving(true);
    try {
      if (selectedPayment) {
        await billingApi.updatePayment(selectedPayment.id, payload);
        showSuccess("Payment updated successfully.");
      } else {
        await billingApi.createPayment(payload);
        showSuccess("Payment recorded successfully.");
      }
      setDialogOpen(false);
      setSelectedPayment(null);
      await loadPayments();
    } catch {
      showError("Payment changes could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Stack spacing={3}>
      <SectionHeader
        eyebrow="Batch 5B"
        title="Payment Management"
        description="Record manual payments, track application status, and monitor receivable collection activity in the tenant billing workspace."
      >
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={() => {
            setSelectedPayment(null);
            setDialogOpen(true);
          }}
        >
          Record Payment
        </Button>
      </SectionHeader>

      <AdminFilterBar>
        <TextField
          label="Search"
          placeholder="Search by payment number, invoice, or payer"
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
            setStatus(event.target.value as PaymentStatus | "");
          }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All Statuses</MenuItem>
          {paymentStatusOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option.replaceAll("_", " ")}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Method"
          value={paymentMethod}
          onChange={(event) => {
            setPage(0);
            setPaymentMethod(event.target.value as PaymentMethod | "");
          }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All Methods</MenuItem>
          {paymentMethodOptions.map((option) => (
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
      </AdminFilterBar>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <PageCard sx={{ p: 0 }}>
        {loading ? (
          <LoadingState />
        ) : items.length === 0 ? (
          <EmptyState
            title="No records found"
            description="Payments will appear here after they are recorded against invoices."
          />
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Payment Number</TableCell>
                  <TableCell>Invoice</TableCell>
                  <TableCell>Bill-to</TableCell>
                  <TableCell>Payment Date</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Updated</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((payment) => (
                  <TableRow key={payment.id} hover>
                    <TableCell>{payment.paymentNumber}</TableCell>
                    <TableCell>{payment.invoiceNumber}</TableCell>
                    <TableCell>{payment.billToNameSnapshot}</TableCell>
                    <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>
                      <StatusChip value={payment.paymentMethod} />
                    </TableCell>
                    <TableCell>
                      <StatusChip value={payment.status} />
                    </TableCell>
                    <TableCell>{formatDateTime(payment.updatedAt)}</TableCell>
                    <TableCell align="right">
                      <TableActionButton
                        title="View Details"
                        onClick={() =>
                          navigate(`/company/payments/${payment.id}`)
                        }
                      >
                        <VisibilityRoundedIcon />
                      </TableActionButton>
                      {payment.status === "RECORDED" ? (
                        <TableActionButton
                          title="Edit Payment"
                          onClick={() => void handleOpenEdit(payment.id)}
                        >
                          <EditRoundedIcon />
                        </TableActionButton>
                      ) : null}
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

      <PaymentUpsertDialog
        open={dialogOpen}
        payment={selectedPayment}
        initialInvoice={null}
        loading={saving}
        onClose={() => {
          setDialogOpen(false);
          setSelectedPayment(null);
        }}
        onSubmit={handleSubmit}
      />
    </Stack>
  );
}
