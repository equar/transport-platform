import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import PublishRoundedIcon from "@mui/icons-material/PublishRounded";
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
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
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
  collectionContactMethodOptions,
  type CollectionContactMethod,
  type InvoiceLineItemPayload,
  type InvoiceLineItemRecord,
  type InvoicePayload,
  type InvoiceRecord,
  type PaymentPayload,
} from "../api/billingApi";
import { InvoiceLineItemDialog } from "../components/InvoiceLineItemDialog";
import { InvoiceUpsertDialog } from "../components/InvoiceUpsertDialog";
import { PaymentUpsertDialog } from "../components/PaymentUpsertDialog";

type InvoiceAction = "issue" | "void" | "remove-line-item";

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(value || 0);
}

function renderDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export function InvoiceDetailsPage() {
  const navigate = useNavigate();
  const { invoiceId } = useParams();
  const resolvedInvoiceId = Number(invoiceId);
  const { showError, showSuccess } = useToast();
  const [invoice, setInvoice] = useState<InvoiceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [invoiceSaving, setInvoiceSaving] = useState(false);
  const [lineItemDialogOpen, setLineItemDialogOpen] = useState(false);
  const [selectedLineItem, setSelectedLineItem] =
    useState<InvoiceLineItemRecord | null>(null);
  const [lineItemSaving, setLineItemSaving] = useState(false);
  const [action, setAction] = useState<InvoiceAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [collectionDialogOpen, setCollectionDialogOpen] = useState(false);
  const [collectionSaving, setCollectionSaving] = useState(false);
  const [collectionMethod, setCollectionMethod] =
    useState<CollectionContactMethod>("EMAIL");
  const [collectionNote, setCollectionNote] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");

  async function loadPage() {
    setLoading(true);
    setError(null);
    try {
      const response = await billingApi.getInvoice(resolvedInvoiceId);
      setInvoice(response);
    } catch {
      setError("Invoice details could not be loaded.");
      setInvoice(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!resolvedInvoiceId) {
      setError("Invoice was not found.");
      setLoading(false);
      return;
    }
    void loadPage();
  }, [resolvedInvoiceId]);

  async function handleInvoiceSubmit(payload: InvoicePayload) {
    if (!invoice) {
      return;
    }
    setInvoiceSaving(true);
    try {
      await billingApi.updateInvoice(invoice.id, payload);
      showSuccess("Invoice updated successfully.");
      setInvoiceDialogOpen(false);
      await loadPage();
    } catch {
      showError("Invoice changes could not be saved.");
    } finally {
      setInvoiceSaving(false);
    }
  }

  async function handleLineItemSubmit(payload: InvoiceLineItemPayload) {
    if (!invoice) {
      return;
    }
    setLineItemSaving(true);
    try {
      if (selectedLineItem) {
        await billingApi.updateLineItem(selectedLineItem.id, payload);
        showSuccess("Line item updated successfully.");
      } else {
        await billingApi.addLineItem(invoice.id, payload);
        showSuccess("Line item added successfully.");
      }
      setLineItemDialogOpen(false);
      setSelectedLineItem(null);
      await loadPage();
    } catch {
      showError("Line item changes could not be saved.");
    } finally {
      setLineItemSaving(false);
    }
  }

  async function handleActionConfirm() {
    if (!invoice || !action) {
      return;
    }
    if (action === "void" && !voidReason.trim()) {
      showError("A void reason is required.");
      return;
    }
    setActionLoading(true);
    try {
      if (action === "issue") {
        await billingApi.issueInvoice(invoice.id);
      } else if (action === "void") {
        await billingApi.voidInvoice(invoice.id, voidReason.trim());
      } else if (selectedLineItem) {
        await billingApi.removeLineItem(selectedLineItem.id);
      }
      showSuccess("Invoice updated successfully.");
      setAction(null);
      setSelectedLineItem(null);
      setVoidReason("");
      await loadPage();
    } catch {
      showError("The invoice action could not be completed.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePaymentSubmit(payload: PaymentPayload) {
    setPaymentSaving(true);
    try {
      await billingApi.createPayment(payload);
      showSuccess("Payment recorded successfully.");
      setPaymentDialogOpen(false);
      await loadPage();
    } catch {
      showError("Payment could not be recorded for this invoice.");
    } finally {
      setPaymentSaving(false);
    }
  }

  async function handleCollectionNoteSubmit() {
    if (!invoice || !collectionNote.trim()) {
      showError("A collection note is required.");
      return;
    }

    setCollectionSaving(true);
    try {
      await billingApi.addCollectionNote(invoice.id, {
        contactMethod: collectionMethod,
        note: collectionNote.trim(),
        nextFollowUpDate: nextFollowUpDate || null,
      });
      showSuccess("Collection note added successfully.");
      setCollectionDialogOpen(false);
      setCollectionMethod("EMAIL");
      setCollectionNote("");
      setNextFollowUpDate("");
      await loadPage();
    } catch {
      showError("Collection note could not be saved.");
    } finally {
      setCollectionSaving(false);
    }
  }

  if (loading) {
    return <LoadingState />;
  }

  if (error || !invoice) {
    return <Alert severity="error">{error ?? "Invoice was not found."}</Alert>;
  }

  const draftInvoice = invoice.status === "DRAFT";

  return (
    <Stack spacing={3}>
      <SectionHeader
        eyebrow="Billing"
        title="Invoice Details"
        description="Review bill-to context, invoice totals, payment history, and collection follow-up before issuing, receiving, or voiding the invoice."
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button
            component={RouterLink}
            to="/company/invoices"
            color="inherit"
            startIcon={<ArrowBackRoundedIcon />}
          >
            Back to Invoices
          </Button>
          {draftInvoice && (
            <Button
              variant="outlined"
              startIcon={<EditRoundedIcon />}
              onClick={() => setInvoiceDialogOpen(true)}
            >
              Edit Invoice
            </Button>
          )}
          {draftInvoice && (
            <Button
              variant="contained"
              startIcon={<PublishRoundedIcon />}
              onClick={() => setAction("issue")}
            >
              Issue Invoice
            </Button>
          )}
          {(invoice.status === "ISSUED" ||
            invoice.status === "OVERDUE" ||
            invoice.status === "PARTIALLY_PAID") && (
            <Button
              variant="contained"
              startIcon={<PaymentsRoundedIcon />}
              onClick={() => setPaymentDialogOpen(true)}
            >
              Record Payment
            </Button>
          )}
          {(invoice.status === "ISSUED" ||
            invoice.status === "OVERDUE" ||
            invoice.status === "PARTIALLY_PAID") && (
            <Button
              variant="outlined"
              onClick={() => setCollectionDialogOpen(true)}
            >
              Add Collection Note
            </Button>
          )}
          {(invoice.status === "ISSUED" || invoice.status === "OVERDUE") && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<BlockRoundedIcon />}
              onClick={() => setAction("void")}
            >
              Void Invoice
            </Button>
          )}
        </Stack>
      </SectionHeader>

      <PageCard>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Invoice Number"
              value={invoice.invoiceNumber}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="Status"
              value={invoice.status.replaceAll("_", " ")}
              InputProps={{
                readOnly: true,
                startAdornment: <StatusChip value={invoice.status} />,
              }}
              fullWidth
            />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Bill-to Type"
              value={invoice.billToType.replaceAll("_", " ")}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="Bill-to"
              value={invoice.billToNameSnapshot}
              InputProps={{ readOnly: true }}
              fullWidth
            />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Invoice Date"
              value={renderDate(invoice.invoiceDate)}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="Due Date"
              value={renderDate(invoice.dueDate)}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="Days Past Due"
              value={invoice.daysPastDue ?? 0}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="Aging Bucket"
              value={invoice.agingBucket?.replaceAll("_", " ") ?? "Current"}
              InputProps={{ readOnly: true }}
              fullWidth
            />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Billing Period"
              value={`${renderDate(invoice.billingPeriodStart)} - ${renderDate(invoice.billingPeriodEnd)}`}
              InputProps={{ readOnly: true }}
              fullWidth
            />
          </Stack>
        </Stack>
      </PageCard>

      <PageCard>
        <Stack spacing={2}>
          <Typography variant="h5">Totals Summary</Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Subtotal"
              value={formatCurrency(invoice.subtotal, invoice.currency)}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="Tax Amount"
              value={formatCurrency(invoice.taxAmount, invoice.currency)}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="Discount Amount"
              value={formatCurrency(invoice.discountAmount, invoice.currency)}
              InputProps={{ readOnly: true }}
              fullWidth
            />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Total Amount"
              value={formatCurrency(invoice.totalAmount, invoice.currency)}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="Amount Paid"
              value={formatCurrency(invoice.amountPaid, invoice.currency)}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="Outstanding Balance"
              value={formatCurrency(invoice.balanceDue, invoice.currency)}
              InputProps={{ readOnly: true }}
              fullWidth
            />
          </Stack>
        </Stack>
      </PageCard>

      <PageCard>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ md: "center" }}
            spacing={2}
          >
            <Stack spacing={0.5}>
              <Typography variant="h5">Line Items</Typography>
              <Typography color="text.secondary">
                Draft invoices can be adjusted with manual or source-backed line
                items.
              </Typography>
            </Stack>
            {draftInvoice && (
              <Button
                variant="outlined"
                startIcon={<AddRoundedIcon />}
                onClick={() => {
                  setSelectedLineItem(null);
                  setLineItemDialogOpen(true);
                }}
              >
                Add Line Item
              </Button>
            )}
          </Stack>
          {invoice.lineItems.length === 0 ? (
            <EmptyState
              title="No records found"
              description="Add line items to a draft invoice before issuing it."
            />
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Line</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Service Date</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Unit Price</TableCell>
                  <TableCell align="right">Line Amount</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoice.lineItems.map((lineItem) => (
                  <TableRow key={lineItem.id} hover>
                    <TableCell>{lineItem.lineNumber}</TableCell>
                    <TableCell>{lineItem.description}</TableCell>
                    <TableCell>
                      <StatusChip value={lineItem.chargeSourceType} />
                    </TableCell>
                    <TableCell>{renderDate(lineItem.serviceDate)}</TableCell>
                    <TableCell align="right">{lineItem.quantity}</TableCell>
                    <TableCell align="right">
                      {formatCurrency(lineItem.unitPrice, invoice.currency)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(lineItem.lineAmount, invoice.currency)}
                    </TableCell>
                    <TableCell align="right">
                      {draftInvoice ? (
                        <>
                          <TableActionButton
                            title="Edit Line Item"
                            onClick={() => {
                              setSelectedLineItem(lineItem);
                              setLineItemDialogOpen(true);
                            }}
                          >
                            <EditRoundedIcon />
                          </TableActionButton>
                          <TableActionButton
                            title="Remove Line Item"
                            onClick={() => {
                              setSelectedLineItem(lineItem);
                              setAction("remove-line-item");
                            }}
                          >
                            <DeleteOutlineRoundedIcon />
                          </TableActionButton>
                        </>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Stack>
      </PageCard>

      <PageCard>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ md: "center" }}
            spacing={2}
          >
            <Stack spacing={0.5}>
              <Typography variant="h5">Payment History</Typography>
              <Typography color="text.secondary">
                Payments recorded against this invoice appear here, including
                recorded and applied states.
              </Typography>
            </Stack>
            {(invoice.status === "ISSUED" ||
              invoice.status === "OVERDUE" ||
              invoice.status === "PARTIALLY_PAID") && (
              <Button
                variant="outlined"
                startIcon={<PaymentsRoundedIcon />}
                onClick={() => setPaymentDialogOpen(true)}
              >
                Record Payment
              </Button>
            )}
          </Stack>
          {invoice.payments.length === 0 ? (
            <EmptyState
              title="No records found"
              description="Payments will appear here after a payment is recorded against this invoice."
            />
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Payment</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoice.payments.map((payment) => (
                  <TableRow key={payment.id} hover>
                    <TableCell>{payment.paymentNumber}</TableCell>
                    <TableCell>{renderDate(payment.paymentDate)}</TableCell>
                    <TableCell>
                      {formatCurrency(payment.amount, invoice.currency)}
                    </TableCell>
                    <TableCell>
                      <StatusChip value={payment.paymentMethod} />
                    </TableCell>
                    <TableCell>
                      <StatusChip value={payment.status} />
                    </TableCell>
                    <TableCell align="right">
                      <TableActionButton
                        title="View Payment"
                        onClick={() =>
                          navigate(`/company/payments/${payment.id}`)
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
        </Stack>
      </PageCard>

      <PageCard>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ md: "center" }}
            spacing={2}
          >
            <Stack spacing={0.5}>
              <Typography variant="h5">Collections Follow-up</Typography>
              <Typography color="text.secondary">
                Maintain tenant-visible follow-up notes for overdue and
                partially paid invoices.
              </Typography>
            </Stack>
            {(invoice.status === "ISSUED" ||
              invoice.status === "OVERDUE" ||
              invoice.status === "PARTIALLY_PAID") && (
              <Button
                variant="outlined"
                onClick={() => setCollectionDialogOpen(true)}
              >
                Add Collection Note
              </Button>
            )}
          </Stack>
          {invoice.collectionNotes.length === 0 ? (
            <EmptyState
              title="No records found"
              description="Collection notes will appear here after follow-up activity is captured for this invoice."
            />
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Contact Method</TableCell>
                  <TableCell>Note</TableCell>
                  <TableCell>Next Follow-up</TableCell>
                  <TableCell>Created By</TableCell>
                  <TableCell>Created At</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoice.collectionNotes.map((note) => (
                  <TableRow key={note.id} hover>
                    <TableCell>
                      <StatusChip value={note.contactMethod} />
                    </TableCell>
                    <TableCell>{note.note}</TableCell>
                    <TableCell>{renderDate(note.nextFollowUpDate)}</TableCell>
                    <TableCell>{note.createdBy}</TableCell>
                    <TableCell>{formatDateTime(note.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Stack>
      </PageCard>

      <PageCard>
        <Stack spacing={2}>
          <Typography variant="h5">Notes and Audit Metadata</Typography>
          <TextField
            label="Notes"
            value={invoice.notes ?? "-"}
            InputProps={{ readOnly: true }}
            multiline
            minRows={3}
            fullWidth
          />
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Created By"
              value={invoice.createdBy}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="Created At"
              value={formatDateTime(invoice.createdAt)}
              InputProps={{ readOnly: true }}
              fullWidth
            />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Updated By"
              value={invoice.updatedBy}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="Updated At"
              value={formatDateTime(invoice.updatedAt)}
              InputProps={{ readOnly: true }}
              fullWidth
            />
          </Stack>
          {invoice.voidReason ? (
            <TextField
              label="Void Reason"
              value={invoice.voidReason}
              InputProps={{ readOnly: true }}
              multiline
              minRows={2}
              fullWidth
            />
          ) : null}
        </Stack>
      </PageCard>

      <InvoiceUpsertDialog
        open={invoiceDialogOpen}
        invoice={invoice}
        loading={invoiceSaving}
        onClose={() => setInvoiceDialogOpen(false)}
        onSubmit={handleInvoiceSubmit}
      />

      <InvoiceLineItemDialog
        open={lineItemDialogOpen}
        lineItem={selectedLineItem}
        loading={lineItemSaving}
        onClose={() => {
          setLineItemDialogOpen(false);
          setSelectedLineItem(null);
        }}
        onSubmit={handleLineItemSubmit}
      />

      <PaymentUpsertDialog
        open={paymentDialogOpen}
        payment={null}
        initialInvoice={invoice}
        loading={paymentSaving}
        onClose={() => setPaymentDialogOpen(false)}
        onSubmit={handlePaymentSubmit}
      />

      <ConfirmDialog
        open={Boolean(action)}
        title={
          action === "issue"
            ? "Issue Invoice"
            : action === "void"
              ? "Void Invoice"
              : "Remove Line Item"
        }
        description={
          action === "issue"
            ? `Issue ${invoice.invoiceNumber} so it becomes an active receivable.`
            : action === "void"
              ? `Void ${invoice.invoiceNumber} and preserve the reason in the billing audit trail.`
              : `Remove line item ${selectedLineItem?.lineNumber ?? ""} from ${invoice.invoiceNumber}.`
        }
        confirmLabel={
          action === "issue"
            ? "Issue Invoice"
            : action === "void"
              ? "Void Invoice"
              : "Remove Line Item"
        }
        loading={actionLoading}
        onCancel={() => {
          setAction(null);
          setSelectedLineItem(null);
          setVoidReason("");
        }}
        onConfirm={handleActionConfirm}
      >
        {action === "void" ? (
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

      <ConfirmDialog
        open={collectionDialogOpen}
        title="Add collection note"
        description="Capture follow-up activity and the next action date for this invoice."
        confirmLabel="Save Note"
        loading={collectionSaving}
        onCancel={() => {
          setCollectionDialogOpen(false);
          setCollectionNote("");
          setNextFollowUpDate("");
          setCollectionMethod("EMAIL");
        }}
        onConfirm={() => void handleCollectionNoteSubmit()}
      >
        <Stack spacing={2} sx={{ mt: 2 }}>
          <TextField
            select
            label="Contact Method"
            value={collectionMethod}
            onChange={(event) =>
              setCollectionMethod(event.target.value as CollectionContactMethod)
            }
            fullWidth
          >
            {collectionContactMethodOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option.replaceAll("_", " ")}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Note"
            value={collectionNote}
            onChange={(event) => setCollectionNote(event.target.value)}
            multiline
            minRows={4}
            fullWidth
          />
          <TextField
            label="Next Follow-up Date"
            type="date"
            value={nextFollowUpDate}
            onChange={(event) => setNextFollowUpDate(event.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Stack>
      </ConfirmDialog>
    </Stack>
  );
}
