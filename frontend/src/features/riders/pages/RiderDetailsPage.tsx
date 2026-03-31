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
import HourglassBottomRoundedIcon from "@mui/icons-material/HourglassBottomRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import PauseCircleRoundedIcon from "@mui/icons-material/PauseCircleRounded";
import PersonOffRoundedIcon from "@mui/icons-material/PersonOffRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import RemoveCircleOutlineRoundedIcon from "@mui/icons-material/RemoveCircleOutlineRounded";
import { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import {
  guardiansApi,
  type GuardianRecord,
} from "../../guardians/api/guardiansApi";
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
  ridersApi,
  type RiderGuardianPayload,
  type RiderGuardianRecord,
  type RiderPayload,
  type RiderRecord,
} from "../api/ridersApi";
import { GuardianLinkDialog } from "../components/GuardianLinkDialog";
import { RiderUpsertDialog } from "../components/RiderUpsertDialog";

type RiderAction = "activate" | "suspend" | "waitlist" | "deactivate";

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

function formatTime(value?: string | null) {
  return value ? value.slice(0, 5) : "-";
}

export function RiderDetailsPage() {
  const { riderId } = useParams();
  const resolvedRiderId = Number(riderId);
  const { showError, showSuccess } = useToast();
  const [rider, setRider] = useState<RiderRecord | null>(null);
  const [availableGuardians, setAvailableGuardians] = useState<
    GuardianRecord[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [riderDialogOpen, setRiderDialogOpen] = useState(false);
  const [riderSaving, setRiderSaving] = useState(false);
  const [relationshipDialogOpen, setRelationshipDialogOpen] = useState(false);
  const [selectedRelationship, setSelectedRelationship] =
    useState<RiderGuardianRecord | null>(null);
  const [relationshipSaving, setRelationshipSaving] = useState(false);
  const [riderAction, setRiderAction] = useState<RiderAction | null>(null);
  const [riderActionLoading, setRiderActionLoading] = useState(false);
  const [unlinkRelationship, setUnlinkRelationship] =
    useState<RiderGuardianRecord | null>(null);
  const [unlinkLoading, setUnlinkLoading] = useState(false);

  async function loadRider() {
    const response = await ridersApi.getById(resolvedRiderId);
    setRider(response);
  }

  async function loadGuardianOptions() {
    const response = await guardiansApi.search({
      keyword: "",
      status: "",
      authorizedForPickup: "",
      billingContact: "",
      page: 0,
      size: 100,
      sortBy: "lastName",
      sortDirection: "ASC",
    });
    setAvailableGuardians(response.items);
  }

  async function loadPage() {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadRider(), loadGuardianOptions()]);
    } catch {
      setError("Rider details could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!resolvedRiderId) {
      setError("Rider was not found.");
      setLoading(false);
      return;
    }
    void loadPage();
  }, [resolvedRiderId]);

  async function handleRiderSubmit(payload: RiderPayload) {
    if (!rider) {
      return;
    }
    setRiderSaving(true);
    try {
      await ridersApi.update(rider.id, payload);
      showSuccess("Rider updated successfully.");
      setRiderDialogOpen(false);
      await loadRider();
    } catch {
      showError("Rider changes could not be saved.");
    } finally {
      setRiderSaving(false);
    }
  }

  async function handleRelationshipSubmit(payload: RiderGuardianPayload) {
    if (!rider) {
      return;
    }
    setRelationshipSaving(true);
    try {
      if (selectedRelationship) {
        await ridersApi.updateGuardianLink(selectedRelationship.id, payload);
        showSuccess("Guardian relationship updated successfully.");
      } else {
        await ridersApi.linkGuardian(rider.id, payload);
        showSuccess("Guardian linked successfully.");
      }
      setRelationshipDialogOpen(false);
      setSelectedRelationship(null);
      await loadRider();
    } catch {
      showError("The guardian relationship could not be saved.");
    } finally {
      setRelationshipSaving(false);
    }
  }

  async function handleRiderAction() {
    if (!rider || !riderAction) {
      return;
    }
    setRiderActionLoading(true);
    try {
      switch (riderAction) {
        case "activate":
          await ridersApi.activate(rider.id);
          break;
        case "suspend":
          await ridersApi.suspend(rider.id);
          break;
        case "waitlist":
          await ridersApi.waitlist(rider.id);
          break;
        case "deactivate":
          await ridersApi.deactivate(rider.id);
          break;
      }
      showSuccess("Rider status updated successfully.");
      setRiderAction(null);
      await loadRider();
    } catch {
      showError("The rider action could not be completed.");
    } finally {
      setRiderActionLoading(false);
    }
  }

  async function handleUnlink() {
    if (!unlinkRelationship) {
      return;
    }
    setUnlinkLoading(true);
    try {
      await ridersApi.unlinkGuardian(unlinkRelationship.id);
      showSuccess("Guardian unlinked successfully.");
      setUnlinkRelationship(null);
      await loadRider();
    } catch {
      showError("Guardian unlink could not be completed.");
    } finally {
      setUnlinkLoading(false);
    }
  }

  if (loading) {
    return <LoadingState />;
  }

  if (error || !rider) {
    return (
      <Stack spacing={3}>
        <Button
          component={RouterLink}
          to="/company/riders"
          startIcon={<ArrowBackRoundedIcon />}
          sx={{ alignSelf: "flex-start" }}
        >
          Back to Rider Management
        </Button>
        <Alert severity="error">{error ?? "Rider was not found."}</Alert>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Button
        component={RouterLink}
        to="/company/riders"
        startIcon={<ArrowBackRoundedIcon />}
        sx={{ alignSelf: "flex-start" }}
      >
        Back to Rider Management
      </Button>

      <SectionHeader
        eyebrow="Company Administration"
        title="Rider Details"
        description="Review contact information, accessibility support needs, guardian relationships, and scheduling-ready preferences for this rider."
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<EditRoundedIcon />}
            onClick={() => setRiderDialogOpen(true)}
          >
            Update Rider
          </Button>
          <Button
            variant="contained"
            startIcon={<LinkRoundedIcon />}
            onClick={() => {
              setSelectedRelationship(null);
              setRelationshipDialogOpen(true);
            }}
          >
            Link Guardian
          </Button>
        </Stack>
      </SectionHeader>

      <PageCard>
        <Stack spacing={2}>
          <Typography variant="overline" color="secondary.main">
            Rider Summary
          </Typography>
          <Typography variant="h3">
            {rider.firstName} {rider.lastName}
          </Typography>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            useFlexGap
            flexWrap="wrap"
          >
            <Chip
              label={`Code: ${rider.riderCode}`}
              color="primary"
              variant="outlined"
            />
            <StatusChip value={rider.status} />
            <StatusChip value={rider.riderType} />
            {rider.wheelchairRequired ? (
              <StatusChip value="WHEELCHAIR" />
            ) : null}
            {rider.escortRequired ? (
              <StatusChip value="ESCORT_REQUIRED" />
            ) : null}
          </Stack>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            useFlexGap
            flexWrap="wrap"
          >
            {rider.status === "PENDING" ||
            rider.status === "SUSPENDED" ||
            rider.status === "WAITLISTED" ||
            rider.status === "INACTIVE" ? (
              <Button
                startIcon={<PlayCircleRoundedIcon />}
                onClick={() => setRiderAction("activate")}
              >
                Activate Rider
              </Button>
            ) : null}
            {rider.status === "PENDING" || rider.status === "ACTIVE" ? (
              <Button
                startIcon={<PauseCircleRoundedIcon />}
                onClick={() => setRiderAction("suspend")}
              >
                Suspend Rider
              </Button>
            ) : null}
            {rider.status === "PENDING" ||
            rider.status === "ACTIVE" ||
            rider.status === "SUSPENDED" ? (
              <Button
                startIcon={<HourglassBottomRoundedIcon />}
                onClick={() => setRiderAction("waitlist")}
              >
                Move to Waitlist
              </Button>
            ) : null}
            {rider.status !== "INACTIVE" ? (
              <Button
                startIcon={<PersonOffRoundedIcon />}
                onClick={() => setRiderAction("deactivate")}
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
            <Typography variant="h5">Contact and Address</Typography>
            <Typography color="text.secondary">
              Email: {rider.email || "-"}
            </Typography>
            <Typography color="text.secondary">
              Primary Phone: {rider.primaryPhone}
            </Typography>
            <Typography color="text.secondary">
              Alternate Phone: {rider.alternatePhone || "-"}
            </Typography>
            <Typography color="text.secondary">
              Address:{" "}
              {[
                rider.homeAddressLine1,
                rider.homeAddressLine2,
                rider.city,
                rider.state,
                rider.zipCode,
                rider.country,
              ]
                .filter(Boolean)
                .join(", ") || "-"}
            </Typography>
          </Stack>
        </PageCard>

        <PageCard>
          <Stack spacing={1.25}>
            <Typography variant="h5">Pickup and Dropoff Preferences</Typography>
            <Typography color="text.secondary">
              Default Pickup Address: {rider.defaultPickupAddress || "-"}
            </Typography>
            <Typography color="text.secondary">
              Default Dropoff Address: {rider.defaultDropoffAddress || "-"}
            </Typography>
            <Typography color="text.secondary">
              Pickup Window: {formatTime(rider.preferredPickupWindowStart)} -{" "}
              {formatTime(rider.preferredPickupWindowEnd)}
            </Typography>
            <Typography color="text.secondary">
              Dropoff Window: {formatTime(rider.preferredDropoffWindowStart)} -{" "}
              {formatTime(rider.preferredDropoffWindowEnd)}
            </Typography>
            <Typography color="text.secondary">
              Pickup Notes: {rider.pickupNotes || "-"}
            </Typography>
            <Typography color="text.secondary">
              Dropoff Notes: {rider.dropoffNotes || "-"}
            </Typography>
          </Stack>
        </PageCard>

        <PageCard>
          <Stack spacing={1.25}>
            <Typography variant="h5">
              Accessibility and Support Needs
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {rider.mobilityNeeds.length > 0 ? (
                rider.mobilityNeeds.map((item) => (
                  <Chip
                    key={item}
                    label={item.replaceAll("_", " ")}
                    color="secondary"
                    variant="outlined"
                  />
                ))
              ) : (
                <Typography color="text.secondary">
                  No mobility needs recorded.
                </Typography>
              )}
            </Stack>
            <Typography color="text.secondary">
              Wheelchair Required: {rider.wheelchairRequired ? "Yes" : "No"}
            </Typography>
            <Typography color="text.secondary">
              Escort Required: {rider.escortRequired ? "Yes" : "No"}
            </Typography>
            <Typography color="text.secondary">
              Special Instructions: {rider.specialInstructions || "-"}
            </Typography>
            <Typography color="text.secondary">
              Care Notes Summary: {rider.careNotesSummary || "-"}
            </Typography>
          </Stack>
        </PageCard>

        <PageCard>
          <Stack spacing={1.25}>
            <Typography variant="h5">
              Emergency Contact and Audit Summary
            </Typography>
            <Typography color="text.secondary">
              Emergency Contact: {rider.emergencyContactName || "-"}
            </Typography>
            <Typography color="text.secondary">
              Emergency Phone: {rider.emergencyContactPhone || "-"}
            </Typography>
            <Typography color="text.secondary">
              Emergency Relationship:{" "}
              {rider.emergencyContactRelationship || "-"}
            </Typography>
            <Typography color="text.secondary">
              Date of Birth: {formatDate(rider.dateOfBirth)}
            </Typography>
            <Typography color="text.secondary">
              Created by {rider.createdBy} on {formatDateTime(rider.createdAt)}
            </Typography>
            <Typography color="text.secondary">
              Last updated by {rider.updatedBy} on{" "}
              {formatDateTime(rider.updatedAt)}
            </Typography>
          </Stack>
        </PageCard>
      </Box>

      <PageCard>
        <Stack spacing={1.25}>
          <Typography variant="h5">Notes</Typography>
          <Typography color="text.secondary">{rider.notes || "-"}</Typography>
        </Stack>
      </PageCard>

      <SectionHeader
        title="Guardian and Family Contacts"
        description="Manage the rider’s guardian relationships, primary contact designation, billing visibility, and pickup authorization."
      />

      <PageCard sx={{ p: 0, overflow: "hidden" }}>
        {rider.guardians.length === 0 ? (
          <EmptyState
            title="No records found"
            description="Link a guardian or family contact to support pickup authorization and billing visibility."
          />
        ) : (
          <Paper sx={{ overflowX: "auto" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Guardian</TableCell>
                  <TableCell>Relationship</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Flags</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rider.guardians.map((relationship) => (
                  <TableRow key={relationship.id} hover>
                    <TableCell>
                      <Typography variant="body2">
                        {relationship.guardianDisplayName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {relationship.guardianEmail ||
                          relationship.guardianPhone ||
                          "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {relationship.relationshipType.replaceAll("_", " ")}
                      </Typography>
                      {relationship.primaryGuardian ? (
                        <Typography variant="caption" color="text.secondary">
                          Primary Guardian
                        </Typography>
                      ) : null}
                    </TableCell>
                    <TableCell>{relationship.guardianPhone || "-"}</TableCell>
                    <TableCell>
                      <Stack
                        direction="row"
                        spacing={1}
                        useFlexGap
                        flexWrap="wrap"
                      >
                        {relationship.authorizedForPickup ? (
                          <Chip
                            label="Authorized for Pickup"
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ) : null}
                        {relationship.billingContact ? (
                          <Chip
                            label="Billing Contact"
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />
                        ) : null}
                        {!relationship.authorizedForPickup &&
                        !relationship.billingContact ? (
                          <Typography variant="caption" color="text.secondary">
                            Standard contact
                          </Typography>
                        ) : null}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <StatusChip value={relationship.guardianStatus} />
                    </TableCell>
                    <TableCell align="right">
                      <TableActionButton
                        title="Update Guardian Link"
                        onClick={() => {
                          setSelectedRelationship(relationship);
                          setRelationshipDialogOpen(true);
                        }}
                      >
                        <EditRoundedIcon />
                      </TableActionButton>
                      <TableActionButton
                        title="Unlink Guardian"
                        onClick={() => setUnlinkRelationship(relationship)}
                      >
                        <RemoveCircleOutlineRoundedIcon />
                      </TableActionButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}
      </PageCard>

      <RiderUpsertDialog
        open={riderDialogOpen}
        rider={rider}
        loading={riderSaving}
        onClose={() => setRiderDialogOpen(false)}
        onSubmit={handleRiderSubmit}
      />

      <GuardianLinkDialog
        open={relationshipDialogOpen}
        guardians={availableGuardians}
        relationship={selectedRelationship}
        loading={relationshipSaving}
        onClose={() => {
          setRelationshipDialogOpen(false);
          setSelectedRelationship(null);
        }}
        onSubmit={handleRelationshipSubmit}
      />

      <ConfirmDialog
        open={Boolean(riderAction)}
        title={
          riderAction === "activate"
            ? "Activate Rider"
            : riderAction === "suspend"
              ? "Suspend Rider"
              : riderAction === "waitlist"
                ? "Move Rider to Waitlist"
                : "Mark Rider Inactive"
        }
        description={
          riderAction
            ? `Apply the ${riderAction} action to ${rider.firstName} ${rider.lastName} (${rider.riderCode})?`
            : ""
        }
        confirmLabel={
          riderAction === "activate"
            ? "Activate Rider"
            : riderAction === "suspend"
              ? "Suspend Rider"
              : riderAction === "waitlist"
                ? "Move to Waitlist"
                : "Mark Inactive"
        }
        loading={riderActionLoading}
        onCancel={() => setRiderAction(null)}
        onConfirm={() => void handleRiderAction()}
      />

      <ConfirmDialog
        open={Boolean(unlinkRelationship)}
        title="Unlink Guardian"
        description={
          unlinkRelationship
            ? `Unlink ${unlinkRelationship.guardianDisplayName} from ${rider.firstName} ${rider.lastName}?`
            : ""
        }
        confirmLabel="Unlink Guardian"
        loading={unlinkLoading}
        onCancel={() => setUnlinkRelationship(null)}
        onConfirm={() => void handleUnlink()}
      />
    </Stack>
  );
}
