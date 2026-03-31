import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DirectionsCarFilledRoundedIcon from "@mui/icons-material/DirectionsCarFilledRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import {
  driverPortalApi,
  type DriverPortalRideDetailRecord,
} from "../api/driverPortalApi";
import { LoadingState } from "../../../shared/components/LoadingState";
import { PageCard } from "../../../shared/components/PageCard";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { StatusChip } from "../../../shared/components/StatusChip";
import { useToast } from "../../../shared/providers/ToastProvider";
import { formatDateTime } from "../../../shared/utils/format";

export function DriverPortalRideDetailsPage() {
  const { rideId } = useParams();
  const resolvedRideId = Number(rideId);
  const { showError, showSuccess } = useToast();
  const [ride, setRide] = useState<DriverPortalRideDetailRecord | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await driverPortalApi.getRide(resolvedRideId);
        if (!cancelled) {
          setRide(response);
        }
      } catch {
        if (!cancelled) {
          setError("Ride detail could not be loaded.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    if (Number.isFinite(resolvedRideId)) {
      void load();
    }
    return () => {
      cancelled = true;
    };
  }, [resolvedRideId]);

  if (loading) {
    return <LoadingState />;
  }

  async function handleAction(action: string) {
    setActionLoading(true);
    try {
      const response = await driverPortalApi.postRideAction(
        resolvedRideId,
        action,
      );
      setRide(response);
      showSuccess("Ride updated.");
    } catch {
      showError("Ride action could not be completed.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAddNote() {
    setActionLoading(true);
    try {
      const response = await driverPortalApi.addRideNote(resolvedRideId, note);
      setRide(response);
      setNote("");
      showSuccess("Ride note added.");
    } catch {
      showError("Ride note could not be saved.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <Stack spacing={3}>
      <Button
        component={RouterLink}
        to="/portal/driver/rides"
        startIcon={<ArrowBackRoundedIcon />}
        sx={{ alignSelf: "flex-start" }}
      >
        Back to rides
      </Button>
      <SectionHeader
        title={ride ? `Ride ${ride.rideNumber}` : "Ride Detail"}
        description="Open trip context, progress updates, and field notes for the assigned ride."
      />
      {error ? <Alert severity="error">{error}</Alert> : null}
      {ride ? (
        <>
          <PageCard>
            <Stack spacing={2}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                spacing={2}
              >
                <Typography variant="h5">{ride.riderName}</Typography>
                <StatusChip value={ride.status} />
              </Stack>
              <Typography color="text.secondary">
                Pickup: {formatDateTime(ride.scheduledPickupAt)}
              </Typography>
              <Typography color="text.secondary">
                Dropoff: {formatDateTime(ride.scheduledDropoffAt)}
              </Typography>
              <Typography>
                Pickup address: {ride.pickupAddress ?? "-"}
              </Typography>
              <Typography>
                Dropoff address: {ride.dropoffAddress ?? "-"}
              </Typography>
              <Typography>
                Special instructions: {ride.specialInstructions ?? "-"}
              </Typography>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1.5}
                flexWrap="wrap"
              >
                <Button
                  startIcon={<DirectionsCarFilledRoundedIcon />}
                  variant="contained"
                  disabled={actionLoading || ride.status !== "ASSIGNED"}
                  onClick={() => handleAction("driver-en-route")}
                >
                  Driver En Route
                </Button>
                <Button
                  startIcon={<PlaceRoundedIcon />}
                  variant="contained"
                  disabled={actionLoading || ride.status !== "DRIVER_EN_ROUTE"}
                  onClick={() => handleAction("arrived")}
                >
                  Arrived
                </Button>
                <Button
                  startIcon={<CheckCircleRoundedIcon />}
                  variant="contained"
                  disabled={actionLoading || ride.status !== "ARRIVED"}
                  onClick={() => handleAction("picked-up")}
                >
                  Picked Up
                </Button>
                <Button
                  startIcon={<FlagRoundedIcon />}
                  variant="contained"
                  disabled={actionLoading || ride.status !== "PICKED_UP"}
                  onClick={() => handleAction("dropped-off")}
                >
                  Dropped Off
                </Button>
                <Button
                  variant="outlined"
                  disabled={actionLoading || ride.status !== "DROPPED_OFF"}
                  onClick={() => handleAction("complete")}
                >
                  Complete Ride
                </Button>
                <Button
                  startIcon={<WarningAmberRoundedIcon />}
                  color="warning"
                  variant="outlined"
                  disabled={
                    actionLoading ||
                    !["ASSIGNED", "ARRIVED"].includes(ride.status)
                  }
                  onClick={() => handleAction("no-show")}
                >
                  No Show
                </Button>
                <Button
                  color="error"
                  variant="outlined"
                  disabled={
                    actionLoading ||
                    ![
                      "ASSIGNED",
                      "DRIVER_EN_ROUTE",
                      "ARRIVED",
                      "PICKED_UP",
                    ].includes(ride.status)
                  }
                  onClick={() => handleAction("failed")}
                >
                  Mark Failed
                </Button>
              </Stack>
            </Stack>
          </PageCard>
          <PageCard>
            <Stack spacing={2}>
              <Typography variant="h5">Operational Notes</Typography>
              <Typography color="text.secondary">
                {ride.operationalNotes ?? "No notes recorded yet."}
              </Typography>
              <TextField
                label="Add note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                multiline
                minRows={3}
                fullWidth
              />
              <Box>
                <Button
                  variant="contained"
                  onClick={handleAddNote}
                  disabled={actionLoading || !note.trim()}
                >
                  Save Note
                </Button>
              </Box>
            </Stack>
          </PageCard>
        </>
      ) : null}
    </Stack>
  );
}
