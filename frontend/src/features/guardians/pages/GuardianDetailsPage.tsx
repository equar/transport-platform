import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PauseCircleRoundedIcon from "@mui/icons-material/PauseCircleRounded";
import PersonOffRoundedIcon from "@mui/icons-material/PersonOffRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
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
  guardiansApi,
  type GuardianPayload,
  type GuardianRecord,
} from "../api/guardiansApi";
import { GuardianUpsertDialog } from "../components/GuardianUpsertDialog";

type GuardianAction = "activate" | "suspend" | "deactivate";

export function GuardianDetailsPage() {
  const navigate = useNavigate();
  const { guardianId } = useParams();
  const resolvedGuardianId = Number(guardianId);
  const { showError, showSuccess } = useToast();
  const [guardian, setGuardian] = useState<GuardianRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [action, setAction] = useState<GuardianAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadGuardian() {
    setLoading(true);
    setError(null);
    try {
      const response = await guardiansApi.getById(resolvedGuardianId);
      setGuardian(response);
    } catch {
      setError("Guardian details could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!resolvedGuardianId) {
      setError("Guardian was not found.");
      setLoading(false);
      return;
    }
    void loadGuardian();
  }, [resolvedGuardianId]);

  async function handleSubmit(payload: GuardianPayload) {
    if (!guardian) {
      return;
    }
    setSaving(true);
    try {
      await guardiansApi.update(guardian.id, payload);
      showSuccess("Guardian updated successfully.");
      setDialogOpen(false);
      await loadGuardian();
    } catch {
      showError("Guardian changes could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAction() {
    if (!guardian || !action) {
      return;
    }
    setActionLoading(true);
    try {
      switch (action) {
        case "activate":
          await guardiansApi.activate(guardian.id);
          break;
        case "suspend":
          await guardiansApi.suspend(guardian.id);
          break;
        case "deactivate":
          await guardiansApi.deactivate(guardian.id);
          break;
      }
      showSuccess("Guardian status updated successfully.");
      setAction(null);
      await loadGuardian();
    } catch {
      showError("The guardian action could not be completed.");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return <LoadingState />;
  }

  if (error || !guardian) {
    return (
      <Stack spacing={3}>
        <Button
          component={RouterLink}
          to="/company/guardians"
          startIcon={<ArrowBackRoundedIcon />}
          sx={{ alignSelf: "flex-start" }}
        >
          Back to Guardian Management
        </Button>
        <Alert severity="error">{error ?? "Guardian was not found."}</Alert>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Button
        component={RouterLink}
        to="/company/guardians"
        startIcon={<ArrowBackRoundedIcon />}
        sx={{ alignSelf: "flex-start" }}
      >
        Back to Guardian Management
      </Button>

      <SectionHeader
        eyebrow="Company Administration"
        title="Guardian Details"
        description="Review communication preferences, pickup and billing permissions, and the riders currently linked to this guardian."
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<EditRoundedIcon />}
            onClick={() => setDialogOpen(true)}
          >
            Update Guardian
          </Button>
        </Stack>
      </SectionHeader>

      <PageCard>
        <Stack spacing={2}>
          <Typography variant="overline" color="secondary.main">
            Guardian Summary
          </Typography>
          <Typography variant="h3">
            {guardian.firstName} {guardian.lastName}
          </Typography>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            useFlexGap
            flexWrap="wrap"
          >
            <StatusChip value={guardian.status} />
            {guardian.preferredCommunicationMethod ? (
              <StatusChip value={guardian.preferredCommunicationMethod} />
            ) : null}
            {guardian.authorizedForPickup ? (
              <StatusChip value="AUTHORIZED_FOR_PICKUP" />
            ) : null}
            {guardian.billingContact ? (
              <StatusChip value="BILLING_CONTACT" />
            ) : null}
          </Stack>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            useFlexGap
            flexWrap="wrap"
          >
            {guardian.status === "PENDING" ||
            guardian.status === "SUSPENDED" ||
            guardian.status === "INACTIVE" ? (
              <Button
                startIcon={<PlayCircleRoundedIcon />}
                onClick={() => setAction("activate")}
              >
                Activate Guardian
              </Button>
            ) : null}
            {guardian.status === "PENDING" || guardian.status === "ACTIVE" ? (
              <Button
                startIcon={<PauseCircleRoundedIcon />}
                onClick={() => setAction("suspend")}
              >
                Suspend Guardian
              </Button>
            ) : null}
            {guardian.status !== "INACTIVE" ? (
              <Button
                startIcon={<PersonOffRoundedIcon />}
                onClick={() => setAction("deactivate")}
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
            <Typography variant="h5">Contact Information</Typography>
            <Typography color="text.secondary">
              Email: {guardian.email || "-"}
            </Typography>
            <Typography color="text.secondary">
              Phone: {guardian.phone}
            </Typography>
            <Typography color="text.secondary">
              Alternate Phone: {guardian.alternatePhone || "-"}
            </Typography>
            <Typography color="text.secondary">
              Preferred Communication:{" "}
              {guardian.preferredCommunicationMethod || "-"}
            </Typography>
          </Stack>
        </PageCard>

        <PageCard>
          <Stack spacing={1.25}>
            <Typography variant="h5">Address and Permissions</Typography>
            <Typography color="text.secondary">
              Address:{" "}
              {[
                guardian.addressLine1,
                guardian.addressLine2,
                guardian.city,
                guardian.state,
                guardian.zipCode,
                guardian.country,
              ]
                .filter(Boolean)
                .join(", ") || "-"}
            </Typography>
            <Typography color="text.secondary">
              Default Relationship to Rider:{" "}
              {guardian.relationToRiderDefault || "-"}
            </Typography>
            <Typography color="text.secondary">
              Authorized for Pickup:{" "}
              {guardian.authorizedForPickup ? "Yes" : "No"}
            </Typography>
            <Typography color="text.secondary">
              Billing Contact: {guardian.billingContact ? "Yes" : "No"}
            </Typography>
          </Stack>
        </PageCard>
      </Box>

      <PageCard>
        <Stack spacing={1.25}>
          <Typography variant="h5">Notes and Audit Summary</Typography>
          <Typography color="text.secondary">
            Notes: {guardian.notes || "-"}
          </Typography>
          <Typography color="text.secondary">
            Created by {guardian.createdBy} on{" "}
            {formatDateTime(guardian.createdAt)}
          </Typography>
          <Typography color="text.secondary">
            Last updated by {guardian.updatedBy} on{" "}
            {formatDateTime(guardian.updatedAt)}
          </Typography>
        </Stack>
      </PageCard>

      <SectionHeader
        title="Linked Riders"
        description="Review riders currently associated with this guardian, including pickup and billing designations."
      />

      <PageCard sx={{ p: 0, overflow: "hidden" }}>
        {guardian.riders.length === 0 ? (
          <EmptyState
            title="No records found"
            description="This guardian is not currently linked to any riders."
          />
        ) : (
          <Paper sx={{ overflowX: "auto" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Rider</TableCell>
                  <TableCell>Relationship</TableCell>
                  <TableCell>Support Needs</TableCell>
                  <TableCell>Flags</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {guardian.riders.map((rider) => (
                  <TableRow key={rider.relationshipId} hover>
                    <TableCell>
                      <Typography variant="body2">
                        {rider.riderDisplayName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {rider.riderCode} •{" "}
                        {rider.riderType.replaceAll("_", " ")}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {rider.relationshipType.replaceAll("_", " ")}
                      </Typography>
                      {rider.primaryGuardian ? (
                        <Typography variant="caption" color="text.secondary">
                          Primary Guardian
                        </Typography>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Stack
                        direction="row"
                        spacing={1}
                        useFlexGap
                        flexWrap="wrap"
                      >
                        {rider.wheelchairRequired ? (
                          <Chip
                            label="Wheelchair"
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />
                        ) : null}
                        {rider.escortRequired ? (
                          <Chip
                            label="Escort"
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />
                        ) : null}
                        {!rider.wheelchairRequired && !rider.escortRequired ? (
                          <Typography variant="caption" color="text.secondary">
                            Standard support profile
                          </Typography>
                        ) : null}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack
                        direction="row"
                        spacing={1}
                        useFlexGap
                        flexWrap="wrap"
                      >
                        {rider.authorizedForPickup ? (
                          <Chip
                            label="Authorized for Pickup"
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ) : null}
                        {rider.billingContact ? (
                          <Chip
                            label="Billing Contact"
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />
                        ) : null}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <StatusChip value={rider.riderStatus} />
                    </TableCell>
                    <TableCell align="right">
                      <TableActionButton
                        title="View Rider Details"
                        onClick={() =>
                          navigate(`/company/riders/${rider.riderId}`)
                        }
                      >
                        <VisibilityRoundedIcon />
                      </TableActionButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}
      </PageCard>

      <GuardianUpsertDialog
        open={dialogOpen}
        guardian={guardian}
        loading={saving}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(action)}
        title={
          action === "activate"
            ? "Activate Guardian"
            : action === "suspend"
              ? "Suspend Guardian"
              : "Mark Guardian Inactive"
        }
        description={
          action
            ? `Apply the ${action} action to ${guardian.firstName} ${guardian.lastName}?`
            : ""
        }
        confirmLabel={
          action === "activate"
            ? "Activate Guardian"
            : action === "suspend"
              ? "Suspend Guardian"
              : "Mark Inactive"
        }
        loading={actionLoading}
        onCancel={() => setAction(null)}
        onConfirm={() => void handleAction()}
      />
    </Stack>
  );
}
