import {
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
  Paper,
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
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PauseCircleRoundedIcon from "@mui/icons-material/PauseCircleRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import ArchiveRoundedIcon from "@mui/icons-material/ArchiveRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import PersonOffRoundedIcon from "@mui/icons-material/PersonOffRounded";
import { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { AdminFilterBar } from "../../../shared/components/AdminFilterBar";
import { ConfirmDialog } from "../../../shared/components/ConfirmDialog";
import { EmptyState } from "../../../shared/components/EmptyState";
import { LoadingState } from "../../../shared/components/LoadingState";
import { PageCard } from "../../../shared/components/PageCard";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { StatusChip } from "../../../shared/components/StatusChip";
import { TableActionButton } from "../../../shared/components/TableActionButton";
import { useToast } from "../../../shared/providers/ToastProvider";
import { formatDateTime } from "../../../shared/utils/format";
import {
  driversApi,
  type DriverDocumentPayload,
  type DriverDocumentRecord,
  type DriverDocumentStatus,
  type DriverDocumentType,
  type DriverDocumentVerificationStatus,
  type DriverPayload,
  type DriverRecord,
} from "../api/driversApi";
import { DriverDocumentReviewDialog } from "../components/DriverDocumentReviewDialog";
import { DriverDocumentUpsertDialog } from "../components/DriverDocumentUpsertDialog";
import { DriverUpsertDialog } from "../components/DriverUpsertDialog";

type DriverAction =
  | "review"
  | "documents-complete"
  | "activate"
  | "suspend"
  | "deactivate"
  | "terminate";
type DocumentAction = "activate" | "archive";

const documentTypes: Array<DriverDocumentType | ""> = [
  "",
  "DRIVER_LICENSE",
  "BACKGROUND_CHECK",
  "DRUG_TEST",
  "CPR_FIRST_AID",
  "NEMT_CERTIFICATION",
  "SCHOOL_TRANSPORT_PERMIT",
  "PROFILE_PHOTO",
  "INSURANCE_PROOF",
  "W9",
  "CONTRACT_AGREEMENT",
  "OTHER",
];
const documentVerificationStatuses: Array<
  DriverDocumentVerificationStatus | ""
> = ["", "PENDING", "VERIFIED", "REJECTED", "EXPIRED"];
const documentStatuses: Array<DriverDocumentStatus | ""> = [
  "",
  "ACTIVE",
  "INACTIVE",
  "ARCHIVED",
];

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export function DriverDetailsPage() {
  const { driverId } = useParams();
  const resolvedDriverId = Number(driverId);
  const { showError, showSuccess } = useToast();
  const [driver, setDriver] = useState<DriverRecord | null>(null);
  const [documents, setDocuments] = useState<DriverDocumentRecord[]>([]);
  const [documentType, setDocumentType] = useState<DriverDocumentType | "">("");
  const [verificationStatus, setVerificationStatus] = useState<
    DriverDocumentVerificationStatus | ""
  >("");
  const [documentStatus, setDocumentStatus] = useState<
    DriverDocumentStatus | ""
  >("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [driverDialogOpen, setDriverDialogOpen] = useState(false);
  const [driverSaving, setDriverSaving] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] =
    useState<DriverDocumentRecord | null>(null);
  const [documentSaving, setDocumentSaving] = useState(false);
  const [reviewState, setReviewState] = useState<{
    mode: "verify" | "reject";
    document: DriverDocumentRecord;
  } | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [driverAction, setDriverAction] = useState<DriverAction | null>(null);
  const [driverActionLoading, setDriverActionLoading] = useState(false);
  const [documentAction, setDocumentAction] = useState<{
    type: DocumentAction;
    document: DriverDocumentRecord;
  } | null>(null);
  const [documentActionLoading, setDocumentActionLoading] = useState(false);

  async function loadDriver() {
    const response = await driversApi.getById(resolvedDriverId);
    setDriver(response);
  }

  async function loadDocuments() {
    const response = await driversApi.listDocuments(resolvedDriverId, {
      documentType,
      verificationStatus,
      status: documentStatus,
      page,
      size,
    });
    setDocuments(response.items);
    setTotal(response.totalElements);
  }

  async function loadPage() {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadDriver(), loadDocuments()]);
    } catch {
      setError("Driver details could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!resolvedDriverId) {
      setError("Driver was not found.");
      setLoading(false);
      return;
    }
    void loadPage();
  }, [
    resolvedDriverId,
    documentType,
    verificationStatus,
    documentStatus,
    page,
    size,
  ]);

  async function handleDriverSubmit(payload: DriverPayload) {
    if (!driver) {
      return;
    }
    setDriverSaving(true);
    try {
      await driversApi.update(driver.id, payload);
      showSuccess("Driver updated successfully.");
      setDriverDialogOpen(false);
      await loadPage();
    } catch {
      showError("Driver changes could not be saved.");
    } finally {
      setDriverSaving(false);
    }
  }

  async function handleDriverAction() {
    if (!driver || !driverAction) {
      return;
    }
    setDriverActionLoading(true);
    try {
      switch (driverAction) {
        case "review":
          await driversApi.review(driver.id);
          break;
        case "documents-complete":
          await driversApi.completeDocuments(driver.id);
          break;
        case "activate":
          await driversApi.activate(driver.id);
          break;
        case "suspend":
          await driversApi.suspend(driver.id);
          break;
        case "deactivate":
          await driversApi.deactivate(driver.id);
          break;
        case "terminate":
          await driversApi.terminate(driver.id);
          break;
      }
      showSuccess("Driver status updated successfully.");
      setDriverAction(null);
      await loadPage();
    } catch {
      showError("The driver action could not be completed.");
    } finally {
      setDriverActionLoading(false);
    }
  }

  async function handleDocumentSubmit(payload: DriverDocumentPayload) {
    if (!driver) {
      return;
    }
    setDocumentSaving(true);
    try {
      if (selectedDocument) {
        await driversApi.updateDocument(selectedDocument.id, payload);
        showSuccess("Driver document updated successfully.");
      } else {
        await driversApi.createDocument(driver.id, payload);
        showSuccess("Driver document added successfully.");
      }
      setDocumentDialogOpen(false);
      setSelectedDocument(null);
      await loadPage();
    } catch {
      showError("Driver document changes could not be saved.");
    } finally {
      setDocumentSaving(false);
    }
  }

  async function handleDocumentReview(notes: string) {
    if (!reviewState) {
      return;
    }
    setReviewLoading(true);
    try {
      if (reviewState.mode === "verify") {
        await driversApi.verifyDocument(reviewState.document.id, { notes });
        showSuccess("Driver document verified successfully.");
      } else {
        await driversApi.rejectDocument(reviewState.document.id, { notes });
        showSuccess("Driver document rejected successfully.");
      }
      setReviewState(null);
      await loadPage();
    } catch {
      showError("The document review action could not be completed.");
    } finally {
      setReviewLoading(false);
    }
  }

  async function handleDocumentAction() {
    if (!documentAction) {
      return;
    }
    setDocumentActionLoading(true);
    try {
      if (documentAction.type === "archive") {
        await driversApi.archiveDocument(documentAction.document.id);
      } else {
        await driversApi.activateDocument(documentAction.document.id);
      }
      showSuccess("Driver document updated successfully.");
      setDocumentAction(null);
      await loadPage();
    } catch {
      showError("The document action could not be completed.");
    } finally {
      setDocumentActionLoading(false);
    }
  }

  if (loading) {
    return <LoadingState />;
  }

  if (error || !driver) {
    return (
      <Stack spacing={3}>
        <Button
          component={RouterLink}
          to="/company/drivers"
          startIcon={<ArrowBackRoundedIcon />}
          sx={{ alignSelf: "flex-start" }}
        >
          Back to Driver Management
        </Button>
        <Alert severity="error">{error ?? "Driver was not found."}</Alert>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Button
        component={RouterLink}
        to="/company/drivers"
        startIcon={<ArrowBackRoundedIcon />}
        sx={{ alignSelf: "flex-start" }}
      >
        Back to Driver Management
      </Button>

      <SectionHeader
        eyebrow="Company Administration"
        title="Driver Details"
        description="Review onboarding progress, contact data, compliance readiness, and document verification for this driver."
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          {driver.status !== "TERMINATED" ? (
            <Button
              variant="outlined"
              startIcon={<EditRoundedIcon />}
              onClick={() => setDriverDialogOpen(true)}
            >
              Update Driver
            </Button>
          ) : null}
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => {
              setSelectedDocument(null);
              setDocumentDialogOpen(true);
            }}
          >
            Add Driver Document
          </Button>
        </Stack>
      </SectionHeader>

      <PageCard>
        <Stack spacing={2}>
          <Typography variant="overline" color="secondary.main">
            Driver Summary
          </Typography>
          <Typography variant="h3">
            {driver.firstName} {driver.lastName}
          </Typography>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            useFlexGap
            flexWrap="wrap"
          >
            <Chip
              label={`Code: ${driver.driverCode}`}
              color="primary"
              variant="outlined"
            />
            <StatusChip value={driver.status} />
            <StatusChip value={driver.driverType} />
            <StatusChip value={driver.complianceSummary.overallStatus} />
          </Stack>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            useFlexGap
            flexWrap="wrap"
          >
            {driver.status === "APPLIED" ||
            driver.status === "PENDING_REVIEW" ? (
              <Button
                startIcon={<AssignmentTurnedInRoundedIcon />}
                onClick={() => setDriverAction("review")}
              >
                Review Driver
              </Button>
            ) : null}
            {driver.status === "DOCUMENT_PENDING" ? (
              <Button
                startIcon={<DescriptionRoundedIcon />}
                onClick={() => setDriverAction("documents-complete")}
              >
                Complete Document Review
              </Button>
            ) : null}
            {driver.status === "TRAINING_PENDING" ||
            driver.status === "SUSPENDED" ||
            driver.status === "INACTIVE" ? (
              <Button
                startIcon={<PlayCircleRoundedIcon />}
                onClick={() => setDriverAction("activate")}
              >
                Activate Driver
              </Button>
            ) : null}
            {driver.status !== "SUSPENDED" &&
            driver.status !== "INACTIVE" &&
            driver.status !== "TERMINATED" ? (
              <Button
                startIcon={<PauseCircleRoundedIcon />}
                onClick={() => setDriverAction("suspend")}
              >
                Suspend Driver
              </Button>
            ) : null}
            {driver.status !== "INACTIVE" && driver.status !== "TERMINATED" ? (
              <Button
                startIcon={<PersonOffRoundedIcon />}
                onClick={() => setDriverAction("deactivate")}
              >
                Mark Inactive
              </Button>
            ) : null}
            {driver.status !== "TERMINATED" ? (
              <Button
                color="error"
                startIcon={<CancelRoundedIcon />}
                onClick={() => setDriverAction("terminate")}
              >
                Terminate Driver
              </Button>
            ) : null}
          </Stack>
        </Stack>
      </PageCard>

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: {
            xs: "1fr",
            lg: "repeat(2, minmax(0, 1fr))",
          },
        }}
      >
        <PageCard>
          <Stack spacing={1.25}>
            <Typography variant="h5">Contact and Address</Typography>
            <Typography color="text.secondary">
              Email: {driver.email || "-"}
            </Typography>
            <Typography color="text.secondary">
              Phone: {driver.phone}
            </Typography>
            <Typography color="text.secondary">
              Alternate Phone: {driver.alternatePhone || "-"}
            </Typography>
            <Typography color="text.secondary">
              Address:{" "}
              {[
                driver.addressLine1,
                driver.addressLine2,
                driver.city,
                driver.state,
                driver.zipCode,
                driver.country,
              ]
                .filter(Boolean)
                .join(", ") || "-"}
            </Typography>
          </Stack>
        </PageCard>
        <PageCard>
          <Stack spacing={1.25}>
            <Typography variant="h5">
              License and Qualification Details
            </Typography>
            <Typography color="text.secondary">
              License Number: {driver.licenseNumber || "-"}
            </Typography>
            <Typography color="text.secondary">
              License State: {driver.licenseState || "-"}
            </Typography>
            <Typography color="text.secondary">
              License Expiry: {formatDate(driver.licenseExpiryDate)}
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <StatusChip value={driver.backgroundCheckStatus} />
              <StatusChip value={driver.drugTestStatus} />
              <StatusChip value={driver.trainingStatus} />
            </Stack>
          </Stack>
        </PageCard>
        <PageCard>
          <Stack spacing={1.25}>
            <Typography variant="h5">Compliance Summary</Typography>
            <Typography color="text.secondary">
              Required Documents:{" "}
              {driver.complianceSummary.requiredDocumentCount}
            </Typography>
            <Typography color="text.secondary">
              Uploaded Documents:{" "}
              {driver.complianceSummary.uploadedDocumentCount}
            </Typography>
            <Typography color="text.secondary">
              Verified Documents:{" "}
              {driver.complianceSummary.verifiedDocumentCount}
            </Typography>
            <Typography color="text.secondary">
              Expired Documents: {driver.complianceSummary.expiredDocumentCount}
            </Typography>
            <Typography color="text.secondary">
              Missing Required Documents:{" "}
              {driver.complianceSummary.missingRequiredDocumentCount}
            </Typography>
            <Typography color="text.secondary">
              Days Until Next Expiring Document:{" "}
              {driver.complianceSummary.daysUntilNextExpiringDocument ?? "-"}
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <StatusChip value={driver.complianceSummary.overallStatus} />
              {driver.complianceSummary.missingRequiredDocumentTypes.map(
                (item) => (
                  <Chip
                    key={item}
                    label={item.replaceAll("_", " ")}
                    color="warning"
                    variant="outlined"
                  />
                ),
              )}
            </Stack>
          </Stack>
        </PageCard>
        <PageCard>
          <Stack spacing={1.25}>
            <Typography variant="h5">Emergency Contact and Notes</Typography>
            <Typography color="text.secondary">
              Emergency Contact: {driver.emergencyContactName || "-"}
            </Typography>
            <Typography color="text.secondary">
              Emergency Phone: {driver.emergencyContactPhone || "-"}
            </Typography>
            <Typography color="text.secondary">
              Relationship: {driver.emergencyContactRelationship || "-"}
            </Typography>
            <Typography color="text.secondary">
              Notes: {driver.notes || "-"}
            </Typography>
            <Typography color="text.secondary">
              Last Updated: {driver.updatedBy} on{" "}
              {formatDateTime(driver.updatedAt)}
            </Typography>
          </Stack>
        </PageCard>
      </Box>

      <SectionHeader
        title="Driver Documents"
        description="Manage document metadata, verification outcomes, expiry visibility, and archive state for this driver."
      />

      <AdminFilterBar>
        <TextField
          label="Document Type"
          select
          value={documentType}
          onChange={(event) => {
            setPage(0);
            setDocumentType(event.target.value as DriverDocumentType | "");
          }}
          sx={{ minWidth: 200 }}
        >
          {documentTypes.map((value) => (
            <MenuItem key={value || "all-document-types"} value={value}>
              {value ? value.replaceAll("_", " ") : "All document types"}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Verification Status"
          select
          value={verificationStatus}
          onChange={(event) => {
            setPage(0);
            setVerificationStatus(
              event.target.value as DriverDocumentVerificationStatus | "",
            );
          }}
          sx={{ minWidth: 220 }}
        >
          {documentVerificationStatuses.map((value) => (
            <MenuItem key={value || "all-verification-statuses"} value={value}>
              {value ? value.replaceAll("_", " ") : "All verification statuses"}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Document Status"
          select
          value={documentStatus}
          onChange={(event) => {
            setPage(0);
            setDocumentStatus(event.target.value as DriverDocumentStatus | "");
          }}
          sx={{ minWidth: 180 }}
        >
          {documentStatuses.map((value) => (
            <MenuItem key={value || "all-document-statuses"} value={value}>
              {value ? value.replaceAll("_", " ") : "All document statuses"}
            </MenuItem>
          ))}
        </TextField>
      </AdminFilterBar>

      <PageCard sx={{ p: 0, overflow: "hidden" }}>
        {documents.length === 0 ? (
          <EmptyState
            title="No records found"
            description="Add driver documents or adjust the filters to review compliance records."
          />
        ) : (
          <>
            <Paper sx={{ overflowX: "auto" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Document Type</TableCell>
                    <TableCell>File</TableCell>
                    <TableCell>Document Number</TableCell>
                    <TableCell>Issue Date</TableCell>
                    <TableCell>Expiry Date</TableCell>
                    <TableCell>Verification</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Notes</TableCell>
                    <TableCell>Uploaded</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {documents.map((document) => (
                    <TableRow key={document.id} hover>
                      <TableCell>
                        {document.documentType.replaceAll("_", " ")}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {document.fileName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {document.originalFileName ||
                            document.contentType ||
                            "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>{document.documentNumber || "-"}</TableCell>
                      <TableCell>{formatDate(document.issueDate)}</TableCell>
                      <TableCell>{formatDate(document.expiryDate)}</TableCell>
                      <TableCell>
                        <StatusChip value={document.verificationStatus} />
                      </TableCell>
                      <TableCell>
                        <StatusChip value={document.status} />
                      </TableCell>
                      <TableCell>{document.notes || "-"}</TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {document.uploadedBy}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDateTime(document.uploadedAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {document.status !== "ARCHIVED" ? (
                          <TableActionButton
                            title="Edit Metadata"
                            onClick={() => {
                              setSelectedDocument(document);
                              setDocumentDialogOpen(true);
                            }}
                          >
                            <EditRoundedIcon />
                          </TableActionButton>
                        ) : null}
                        {document.status === "ACTIVE" &&
                        document.verificationStatus !== "VERIFIED" &&
                        document.verificationStatus !== "EXPIRED" ? (
                          <TableActionButton
                            title="Verify Document"
                            onClick={() =>
                              setReviewState({ mode: "verify", document })
                            }
                          >
                            <CheckCircleRoundedIcon />
                          </TableActionButton>
                        ) : null}
                        {document.status === "ACTIVE" &&
                        document.verificationStatus !== "REJECTED" ? (
                          <TableActionButton
                            title="Reject Document"
                            onClick={() =>
                              setReviewState({ mode: "reject", document })
                            }
                          >
                            <CancelRoundedIcon />
                          </TableActionButton>
                        ) : null}
                        {document.status === "ARCHIVED" ? null : (
                          <TableActionButton
                            title="Archive Document"
                            onClick={() =>
                              setDocumentAction({ type: "archive", document })
                            }
                          >
                            <ArchiveRoundedIcon />
                          </TableActionButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
            <TablePagination
              component="div"
              count={total}
              page={page}
              rowsPerPage={size}
              onPageChange={(_, nextPage) => setPage(nextPage)}
              onRowsPerPageChange={(event) => {
                setSize(Number(event.target.value));
                setPage(0);
              }}
            />
          </>
        )}
      </PageCard>

      <DriverUpsertDialog
        open={driverDialogOpen}
        driver={driver}
        loading={driverSaving}
        onClose={() => setDriverDialogOpen(false)}
        onSubmit={handleDriverSubmit}
      />

      <DriverDocumentUpsertDialog
        open={documentDialogOpen}
        document={selectedDocument}
        loading={documentSaving}
        onClose={() => {
          setDocumentDialogOpen(false);
          setSelectedDocument(null);
        }}
        onSubmit={handleDocumentSubmit}
      />

      <DriverDocumentReviewDialog
        open={Boolean(reviewState)}
        mode={reviewState?.mode ?? "verify"}
        document={reviewState?.document ?? null}
        loading={reviewLoading}
        onClose={() => setReviewState(null)}
        onSubmit={handleDocumentReview}
      />

      <ConfirmDialog
        open={Boolean(driverAction)}
        title={
          driverAction
            ? driverAction.replaceAll("-", " ")
            : "Confirm Driver Action"
        }
        description={
          driverAction
            ? `Apply the ${driverAction.replaceAll("-", " ")} action to ${driver.firstName} ${driver.lastName}?`
            : ""
        }
        confirmLabel={
          driverAction ? driverAction.replaceAll("-", " ") : "Confirm"
        }
        loading={driverActionLoading}
        onCancel={() => setDriverAction(null)}
        onConfirm={() => void handleDriverAction()}
      />

      <ConfirmDialog
        open={Boolean(documentAction)}
        title={
          documentAction?.type === "archive"
            ? "Archive Driver Document"
            : "Activate Driver Document"
        }
        description={
          documentAction?.type === "archive"
            ? "Archive this driver document and remove it from the active compliance set."
            : "Activate this driver document and return it to the active compliance set."
        }
        confirmLabel={
          documentAction?.type === "archive"
            ? "Archive Document"
            : "Activate Document"
        }
        loading={documentActionLoading}
        onCancel={() => setDocumentAction(null)}
        onConfirm={() => void handleDocumentAction()}
      />
    </Stack>
  );
}
