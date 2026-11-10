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
import { useEffect, useState, useRef } from "react";
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
  const [retryCount, setRetryCount] = useState(0);
  const actionInFlight = useRef(false);
  const previousRideId = useRef<number | null>(null);
  const activeRideId = useRef(resolvedRideId);
  activeRideId.current = resolvedRideId;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let pending = false;
    let finished = false;
    setRide(null);
    setError(null);
    if (previousRideId.current !== resolvedRideId) { setNote(''); setActionLoading(false); actionInFlight.current = false; previousRideId.current = resolvedRideId; }
    if (!Number.isSafeInteger(resolvedRideId) || resolvedRideId <= 0) {
      setLoading(false); setError('Choose a valid trip from your trip list.'); return;
    }
    async function load(background = false) {
      if (pending || cancelled) return;
      pending = true;
      if (!background) setLoading(true);
      try {
        const response = await driverPortalApi.getRide(resolvedRideId);
        if (!cancelled) {
          if (activeRideId.current !== resolvedRideId) return;
          setRide(response); setError(null);
          finished = ['COMPLETED', 'CANCELLED', 'MISSED', 'FAILED', 'RIDER_NO_SHOW'].includes(response.status);
        }
      } catch {
        if (!cancelled) { setRide(null); setError('Ride detail could not be loaded. Check your access and connection, then retry.'); }
      } finally {
        pending = false;
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    const timer = window.setInterval(() => { if (!finished && document.visibilityState !== 'hidden') void load(true); }, 15000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [resolvedRideId, retryCount]);

  if (loading) {
    return <LoadingState />;
  }

  async function handleAction(action: string) {
    if (actionInFlight.current) return;
    actionInFlight.current = true;
    setActionLoading(true);
    try {
      const response = await driverPortalApi.postRideAction(
        resolvedRideId,
        action,
        ride?.status,
      );
      if (activeRideId.current !== resolvedRideId) return;
      setRide(response);
      showSuccess("Ride updated.");
    } catch {
      if (activeRideId.current === resolvedRideId) { showError("Ride action could not be completed. Refreshing the current assignment."); setRetryCount(value => value + 1); }
    } finally {
      if (activeRideId.current === resolvedRideId) { actionInFlight.current = false; setActionLoading(false); }
    }
  }

  async function handleAddNote() {
    if (actionInFlight.current || !note.trim()) return;
    actionInFlight.current = true;
    setActionLoading(true);
    try {
      const response = await driverPortalApi.addRideNote(resolvedRideId, note);
      if (activeRideId.current !== resolvedRideId) return;
      setRide(response);
      setNote("");
      showSuccess("Ride note added.");
    } catch {
      showError("Ride note could not be saved.");
    } finally {
      if (activeRideId.current === resolvedRideId) { actionInFlight.current = false; setActionLoading(false); }
    }
  }

  return (
    <Stack spacing={2.5}>
      <Button
        component={RouterLink}
        to="/portal/driver/rides"
        startIcon={<ArrowBackRoundedIcon />}
        sx={{ alignSelf: "flex-start" }}
      >
        Back to rides
      </Button>
      <PageCard>
        <Stack spacing={1}>
          <Typography variant="h4">
            {ride ? `Ride ${ride.rideNumber}` : "Ride detail"}
          </Typography>
          <Typography color="text.secondary">
            Review the assigned trip, update ride status, and leave operational
            notes only for your own ride.
          </Typography>
        </Stack>
      </PageCard>
      {error ? <Alert severity="error" action={<Button onClick={() => setRetryCount(value => value + 1)}>Retry</Button>}>{error}</Alert> : null}
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
              <Typography>
                Route assignment:{" "}
                {ride.routeId ? `Route #${ride.routeId}` : "No route assigned"}
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
                    ride.status !== "ARRIVED"
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
