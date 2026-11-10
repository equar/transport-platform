import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import RepeatRoundedIcon from "@mui/icons-material/RepeatRounded";
import { Alert, Button, Chip, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { LoadingState } from "../../../shared/components/LoadingState";
import { PageCard } from "../../../shared/components/PageCard";
import { StatusChip } from "../../../shared/components/StatusChip";
import { formatDateTime } from "../../../shared/utils/format";
import {
  riderGuardianPortalApi,
  type RiderGuardianPortalRideDetailRecord,
} from "../api/riderGuardianPortalApi";

export function RiderGuardianPortalRideDetailsPage() {
  const { rideId } = useParams();
  const resolvedRideId = Number(rideId);
  const [ride, setRide] = useState<RiderGuardianPortalRideDetailRecord | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let pending = false;
    let finished = false;
    setRide(null);
    setError(null);
    if (!Number.isSafeInteger(resolvedRideId) || resolvedRideId <= 0) {
      setLoading(false); setError('Choose a valid trip from your trip list.'); return;
    }
    async function load(background = false) {
      if (pending || cancelled) return;
      pending = true;
      if (!background) setLoading(true);
      try {
        const response = await riderGuardianPortalApi.getRide(resolvedRideId);
        if (!cancelled) {
          setRide(response); setError(null);
          finished = ['DROPPED_OFF', 'COMPLETED', 'CANCELLED', 'MISSED', 'FAILED', 'RIDER_NO_SHOW'].includes(response.status);
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

  return (
    <Stack spacing={2.5}>
      <Button
        component={RouterLink}
        to="/portal/rider/rides"
        startIcon={<ArrowBackRoundedIcon />}
        sx={{ alignSelf: "flex-start" }}
      >
        Back to rides
      </Button>
      {error ? <Alert severity="error" action={<Button onClick={() => setRetryCount(value => value + 1)}>Retry</Button>}>{error}</Alert> : null}
      {ride ? (
        <>
          <PageCard>
            <Stack spacing={1.25}>
              <Typography variant="h4">Ride {ride.rideNumber}</Typography>
              <Typography color="text.secondary">
                Viewing rider: {ride.riderName}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <StatusChip value={ride.status} />
                {ride.recurringRide ? (
                  <Chip icon={<RepeatRoundedIcon />} label="Recurring ride" />
                ) : null}
              </Stack>
            </Stack>
          </PageCard>
          <PageCard>
            <Stack spacing={1.5}>
              <Typography variant="h5">Trip overview</Typography>
              <Typography color="text.secondary">
                Pickup: {formatDateTime(ride.scheduledPickupAt)}
              </Typography>
              <Typography color="text.secondary">
                Dropoff: {formatDateTime(ride.scheduledDropoffAt)}
              </Typography>
              <Typography color="text.secondary">
                Pickup address: {ride.pickupAddress ?? "Not available"}
              </Typography>
              <Typography color="text.secondary">
                Dropoff address: {ride.dropoffAddress ?? "Not available"}
              </Typography>
              <Typography color="text.secondary">
                Organization: {ride.organizationName ?? "Not provided"}
              </Typography>
              <Typography color="text.secondary">
                Trip type: {ride.tripType}
              </Typography>
              <Typography color="text.secondary">
                Service type: {ride.serviceType}
              </Typography>
            </Stack>
          </PageCard>
        </>
      ) : null}
    </Stack>
  );
}
