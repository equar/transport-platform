import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import RepeatRoundedIcon from "@mui/icons-material/RepeatRounded";
import { Alert, Button, Chip, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { LoadingState } from "../../../shared/components/LoadingState";
import { PageCard } from "../../../shared/components/PageCard";
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRide() {
      setLoading(true);
      setError(null);
      try {
        const response = await riderGuardianPortalApi.getRide(resolvedRideId);
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
      void loadRide();
    }

    return () => {
      cancelled = true;
    };
  }, [resolvedRideId]);

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
      {error ? <Alert severity="error">{error}</Alert> : null}
      {ride ? (
        <>
          <PageCard>
            <Stack spacing={1.25}>
              <Typography variant="h4">Ride {ride.rideNumber}</Typography>
              <Typography color="text.secondary">
                Viewing rider: {ride.riderName}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  label={ride.status.replaceAll("_", " ")}
                  color="secondary"
                />
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
