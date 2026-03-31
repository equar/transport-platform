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
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import BuildCircleRoundedIcon from "@mui/icons-material/BuildCircleRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import PauseCircleRoundedIcon from "@mui/icons-material/PauseCircleRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArchiveRoundedIcon from "@mui/icons-material/ArchiveRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
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
  vehiclesApi,
  type VehicleDocumentPayload,
  type VehicleDocumentRecord,
  type VehicleDocumentStatus,
  type VehicleDocumentType,
  type VehicleDocumentVerificationStatus,
  type VehiclePayload,
  type VehicleRecord,
} from "../api/vehiclesApi";
import { VehicleDocumentReviewDialog } from "../components/VehicleDocumentReviewDialog";
import { VehicleDocumentUpsertDialog } from "../components/VehicleDocumentUpsertDialog";
import { VehicleUpsertDialog } from "../components/VehicleUpsertDialog";

type VehicleAction =
  | "activate"
  | "suspend"
  | "maintenance"
  | "out-of-service"
  | "deactivate";

type DocumentAction = "activate" | "archive";

const documentTypes: Array<VehicleDocumentType | ""> = [
  "",
  "VEHICLE_REGISTRATION",
  "VEHICLE_INSURANCE",
  "VEHICLE_INSPECTION",
  "TITLE",
  "LEASE_AGREEMENT",
  "WHEELCHAIR_EQUIPMENT_CERTIFICATION",
  "MAINTENANCE_RECORD",
  "VEHICLE_PHOTO",
  "OTHER",
];

const documentVerificationStatuses: Array<
  VehicleDocumentVerificationStatus | ""
> = ["", "PENDING", "VERIFIED", "REJECTED", "EXPIRED"];

const documentStatuses: Array<VehicleDocumentStatus | ""> = [
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

export function VehicleDetailsPage() {
  const { vehicleId } = useParams();
  const resolvedVehicleId = Number(vehicleId);
  const { showError, showSuccess } = useToast();
  const [vehicle, setVehicle] = useState<VehicleRecord | null>(null);
  const [documents, setDocuments] = useState<VehicleDocumentRecord[]>([]);
  const [documentType, setDocumentType] = useState<VehicleDocumentType | "">(
    "",
  );
  const [verificationStatus, setVerificationStatus] = useState<
    VehicleDocumentVerificationStatus | ""
  >("");
  const [documentStatus, setDocumentStatus] = useState<
    VehicleDocumentStatus | ""
  >("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [vehicleSaving, setVehicleSaving] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] =
    useState<VehicleDocumentRecord | null>(null);
  const [documentSaving, setDocumentSaving] = useState(false);
  const [reviewState, setReviewState] = useState<{
    mode: "verify" | "reject";
    document: VehicleDocumentRecord;
  } | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [vehicleAction, setVehicleAction] = useState<VehicleAction | null>(
    null,
  );
  const [vehicleActionLoading, setVehicleActionLoading] = useState(false);
  const [documentAction, setDocumentAction] = useState<{
    type: DocumentAction;
    document: VehicleDocumentRecord;
  } | null>(null);
  const [documentActionLoading, setDocumentActionLoading] = useState(false);

  async function loadVehicle() {
    const response = await vehiclesApi.getById(resolvedVehicleId);
    setVehicle(response);
  }

  async function loadDocuments() {
    const response = await vehiclesApi.listDocuments(resolvedVehicleId, {
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
      await Promise.all([loadVehicle(), loadDocuments()]);
    } catch {
      setError("Vehicle details could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!resolvedVehicleId) {
      setError("Vehicle was not found.");
      setLoading(false);
      return;
    }
    void loadPage();
  }, [
    documentStatus,
    documentType,
    page,
    resolvedVehicleId,
    size,
    verificationStatus,
  ]);

  async function handleVehicleSubmit(payload: VehiclePayload) {
    if (!vehicle) {
      return;
    }
    setVehicleSaving(true);
    try {
      await vehiclesApi.update(vehicle.id, payload);
      showSuccess("Vehicle updated successfully.");
      setVehicleDialogOpen(false);
      await loadPage();
    } catch {
      showError("Vehicle changes could not be saved.");
    } finally {
      setVehicleSaving(false);
    }
  }

  async function handleVehicleAction() {
    if (!vehicle || !vehicleAction) {
      return;
    }
    setVehicleActionLoading(true);
    try {
      switch (vehicleAction) {
        case "activate":
          await vehiclesApi.activate(vehicle.id);
          break;
        case "suspend":
          await vehiclesApi.suspend(vehicle.id);
          break;
        case "maintenance":
          await vehiclesApi.markMaintenance(vehicle.id);
          break;
        case "out-of-service":
          await vehiclesApi.markOutOfService(vehicle.id);
          break;
        case "deactivate":
          await vehiclesApi.deactivate(vehicle.id);
          break;
      }
      showSuccess("Vehicle status updated successfully.");
      setVehicleAction(null);
      await loadPage();
    } catch {
      showError("The vehicle action could not be completed.");
    } finally {
      setVehicleActionLoading(false);
    }
  }

  async function handleDocumentSubmit(payload: VehicleDocumentPayload) {
    if (!vehicle) {
      return;
    }
    setDocumentSaving(true);
    try {
      if (selectedDocument) {
        await vehiclesApi.updateDocument(selectedDocument.id, payload);
        showSuccess("Vehicle document updated successfully.");
      } else {
        await vehiclesApi.createDocument(vehicle.id, payload);
        showSuccess("Vehicle document added successfully.");
      }
      setDocumentDialogOpen(false);
      setSelectedDocument(null);
      await loadPage();
    } catch {
      showError("Vehicle document changes could not be saved.");
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
        await vehiclesApi.verifyDocument(reviewState.document.id, { notes });
        showSuccess("Vehicle document verified successfully.");
      } else {
        await vehiclesApi.rejectDocument(reviewState.document.id, { notes });
        showSuccess("Vehicle document rejected successfully.");
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
        await vehiclesApi.archiveDocument(documentAction.document.id);
      } else {
        await vehiclesApi.activateDocument(documentAction.document.id);
      }
      showSuccess("Vehicle document updated successfully.");
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

  if (error || !vehicle) {
    return (
      <Stack spacing={3}>
        <Button
          component={RouterLink}
          to="/company/vehicles"
          startIcon={<ArrowBackRoundedIcon />}
          sx={{ alignSelf: "flex-start" }}
        >
          Back to Vehicle Management
        </Button>
        <Alert severity="error">{error ?? "Vehicle was not found."}</Alert>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Button
        component={RouterLink}
        to="/company/vehicles"
        startIcon={<ArrowBackRoundedIcon />}
        sx={{ alignSelf: "flex-start" }}
      >
        Back to Vehicle Management
      </Button>

      <SectionHeader
        eyebrow="Company Administration"
        title="Vehicle Details"
        description="Review operational readiness, ownership, capacity, document verification, and compliance posture for this vehicle."
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<EditRoundedIcon />}
            onClick={() => setVehicleDialogOpen(true)}
          >
            Update Vehicle
          </Button>
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => {
              setSelectedDocument(null);
              setDocumentDialogOpen(true);
            }}
          >
            Add Vehicle Document
          </Button>
        </Stack>
      </SectionHeader>

      <PageCard>
        <Stack spacing={2}>
          <Typography variant="overline" color="secondary.main">
            Vehicle Summary
          </Typography>
          <Typography variant="h3">
            {vehicle.make} {vehicle.model}
          </Typography>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            useFlexGap
            flexWrap="wrap"
          >
            <Chip
              label={`Code: ${vehicle.vehicleCode}`}
              color="primary"
              variant="outlined"
            />
            <Chip
              label={`Year: ${vehicle.year}`}
              color="primary"
              variant="outlined"
            />
            <StatusChip value={vehicle.status} />
            <StatusChip value={vehicle.ownershipType} />
            <StatusChip value={vehicle.complianceSummary.overallStatus} />
          </Stack>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            useFlexGap
            flexWrap="wrap"
          >
            {vehicle.status !== "ACTIVE" ? (
              <Button
                startIcon={<PlayCircleRoundedIcon />}
                onClick={() => setVehicleAction("activate")}
              >
                Activate Vehicle
              </Button>
            ) : null}
            {vehicle.status === "ACTIVE" ? (
              <Button
                startIcon={<BuildCircleRoundedIcon />}
                onClick={() => setVehicleAction("maintenance")}
              >
                Mark as Maintenance
              </Button>
            ) : null}
            {vehicle.status === "ACTIVE" || vehicle.status === "MAINTENANCE" ? (
              <Button
                startIcon={<BlockRoundedIcon />}
                onClick={() => setVehicleAction("out-of-service")}
              >
                Mark Out of Service
              </Button>
            ) : null}
            {vehicle.status === "ACTIVE" ? (
              <Button
                startIcon={<PauseCircleRoundedIcon />}
                onClick={() => setVehicleAction("suspend")}
              >
                Suspend Vehicle
              </Button>
            ) : null}
            {vehicle.status !== "INACTIVE" ? (
              <Button
                startIcon={<PersonOffRoundedIcon />}
                onClick={() => setVehicleAction("deactivate")}
              >
                Mark Inactive
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
            <Typography variant="h5">
              Registration and Plate Information
            </Typography>
            <Typography color="text.secondary">
              VIN: {vehicle.vin || "-"}
            </Typography>
            <Typography color="text.secondary">
              Plate Number: {vehicle.plateNumber}
            </Typography>
            <Typography color="text.secondary">
              Plate State: {vehicle.plateState}
            </Typography>
            <Typography color="text.secondary">
              Registration Expiry: {formatDate(vehicle.registrationExpiryDate)}
            </Typography>
          </Stack>
        </PageCard>

        <PageCard>
          <Stack spacing={1.25}>
            <Typography variant="h5">
              Insurance and Inspection Details
            </Typography>
            <Typography color="text.secondary">
              Insurance Policy Number: {vehicle.insurancePolicyNumber || "-"}
            </Typography>
            <Typography color="text.secondary">
              Insurance Expiry: {formatDate(vehicle.insuranceExpiryDate)}
            </Typography>
            <Typography color="text.secondary">
              Inspection Expiry: {formatDate(vehicle.inspectionExpiryDate)}
            </Typography>
            <Typography color="text.secondary">
              Fuel Type: {vehicle.fuelType?.replaceAll("_", " ") || "-"}
            </Typography>
          </Stack>
        </PageCard>

        <PageCard>
          <Stack spacing={1.25}>
            <Typography variant="h5">
              Capacity and Service Capabilities
            </Typography>
            <Typography color="text.secondary">
              Capacity: {vehicle.capacity}
            </Typography>
            <Typography color="text.secondary">
              Wheelchair Capacity: {vehicle.wheelchairCapacity ?? 0}
            </Typography>
            <Typography color="text.secondary">
              Mileage: {vehicle.mileage ?? "-"}
            </Typography>
            <Typography color="text.secondary">
              Assigned Driver Reference: {vehicle.assignedDriverId ?? "-"}
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {vehicle.serviceTypesSupported.length > 0 ? (
                vehicle.serviceTypesSupported.map((serviceType) => (
                  <Chip
                    key={serviceType}
                    label={serviceType.replaceAll("_", " ")}
                    color="secondary"
                    variant="outlined"
                  />
                ))
              ) : (
                <Typography color="text.secondary">
                  No service types selected.
                </Typography>
              )}
            </Stack>
          </Stack>
        </PageCard>

        <PageCard>
          <Stack spacing={1.25}>
            <Typography variant="h5">Compliance Summary</Typography>
            <Typography color="text.secondary">
              Required Documents:{" "}
              {vehicle.complianceSummary.requiredDocumentCount}
            </Typography>
            <Typography color="text.secondary">
              Uploaded Documents:{" "}
              {vehicle.complianceSummary.uploadedDocumentCount}
            </Typography>
            <Typography color="text.secondary">
              Verified Documents:{" "}
              {vehicle.complianceSummary.verifiedDocumentCount}
            </Typography>
            <Typography color="text.secondary">
              Expired Documents:{" "}
              {vehicle.complianceSummary.expiredDocumentCount}
            </Typography>
            <Typography color="text.secondary">
              Missing Required Documents:{" "}
              {vehicle.complianceSummary.missingRequiredDocumentCount}
            </Typography>
            <Typography color="text.secondary">
              Days Until Next Expiring Document:{" "}
              {vehicle.complianceSummary.daysUntilNextExpiringDocument ?? "-"}
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <StatusChip value={vehicle.complianceSummary.overallStatus} />
              {vehicle.complianceSummary.missingRequiredDocumentTypes.map(
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
      </Box>

      <PageCard>
        <Stack spacing={1.25}>
          <Typography variant="h5">Notes and Audit Summary</Typography>
          <Typography color="text.secondary">
            Notes: {vehicle.notes || "-"}
          </Typography>
          <Typography color="text.secondary">
            Created by {vehicle.createdBy} on{" "}
            {formatDateTime(vehicle.createdAt)}
          </Typography>
          <Typography color="text.secondary">
            Last updated by {vehicle.updatedBy} on{" "}
            {formatDateTime(vehicle.updatedAt)}
          </Typography>
        </Stack>
      </PageCard>

      <SectionHeader
        title="Vehicle Documents"
        description="Manage document metadata, verification outcomes, expiry visibility, and archive state for this vehicle."
      />

      <AdminFilterBar>
        <TextField
          label="Document Type"
          select
          value={documentType}
          onChange={(event) => {
            setPage(0);
            setDocumentType(event.target.value as VehicleDocumentType | "");
          }}
          sx={{ minWidth: 220 }}
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
              event.target.value as VehicleDocumentVerificationStatus | "",
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
            setDocumentStatus(event.target.value as VehicleDocumentStatus | "");
          }}
          sx={{ minWidth: 200 }}
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
            description="Add vehicle documents or adjust the filters to review compliance records."
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
                        {document.status !== "ARCHIVED" ? (
                          <TableActionButton
                            title="Archive Document"
                            onClick={() =>
                              setDocumentAction({ type: "archive", document })
                            }
                          >
                            <ArchiveRoundedIcon />
                          </TableActionButton>
                        ) : null}
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

      <VehicleUpsertDialog
        open={vehicleDialogOpen}
        vehicle={vehicle}
        loading={vehicleSaving}
        onClose={() => setVehicleDialogOpen(false)}
        onSubmit={handleVehicleSubmit}
      />

      <VehicleDocumentUpsertDialog
        open={documentDialogOpen}
        document={selectedDocument}
        loading={documentSaving}
        onClose={() => {
          setDocumentDialogOpen(false);
          setSelectedDocument(null);
        }}
        onSubmit={handleDocumentSubmit}
      />

      <VehicleDocumentReviewDialog
        open={Boolean(reviewState)}
        mode={reviewState?.mode ?? "verify"}
        document={reviewState?.document ?? null}
        loading={reviewLoading}
        onClose={() => setReviewState(null)}
        onSubmit={handleDocumentReview}
      />

      <ConfirmDialog
        open={Boolean(vehicleAction)}
        title={
          vehicleAction
            ? vehicleAction === "maintenance"
              ? "Mark as Maintenance"
              : vehicleAction === "out-of-service"
                ? "Mark Out of Service"
                : vehicleAction === "deactivate"
                  ? "Mark Vehicle Inactive"
                  : `${vehicleAction.charAt(0).toUpperCase()}${vehicleAction.slice(1)} Vehicle`
            : "Confirm Vehicle Action"
        }
        description={
          vehicleAction
            ? `Apply the ${vehicleAction.replaceAll("-", " ")} action to ${vehicle.make} ${vehicle.model} (${vehicle.vehicleCode})?`
            : ""
        }
        confirmLabel={
          vehicleAction
            ? vehicleAction === "maintenance"
              ? "Mark as Maintenance"
              : vehicleAction === "out-of-service"
                ? "Mark Out of Service"
                : vehicleAction === "deactivate"
                  ? "Mark Inactive"
                  : `${vehicleAction.charAt(0).toUpperCase()}${vehicleAction.slice(1)} Vehicle`
            : "Confirm"
        }
        loading={vehicleActionLoading}
        onCancel={() => setVehicleAction(null)}
        onConfirm={() => void handleVehicleAction()}
      />

      <ConfirmDialog
        open={Boolean(documentAction)}
        title={
          documentAction?.type === "archive"
            ? "Archive Vehicle Document"
            : "Activate Vehicle Document"
        }
        description={
          documentAction?.type === "archive"
            ? "Archive this vehicle document and remove it from the active compliance set."
            : "Activate this vehicle document and return it to the active compliance set."
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
