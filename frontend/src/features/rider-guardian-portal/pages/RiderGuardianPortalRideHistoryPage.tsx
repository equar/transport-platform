import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { Alert, Button, Chip, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoadingState } from "../../../shared/components/LoadingState";
import { PageCard } from "../../../shared/components/PageCard";
import { formatDateTime } from "../../../shared/utils/format";
import {
  riderGuardianPortalApi,
  type RiderGuardianPortalRideRecord,
} from "../api/riderGuardianPortalApi";

function isHistoryRide(ride: RiderGuardianPortalRideRecord) {
  const scheduledPickup = new Date(ride.scheduledPickupAt).getTime();
  return (
    ride.status === "COMPLETED" ||
    ride.status === "CANCELLED" ||
    scheduledPickup < Date.now()
  );
}

export function RiderGuardianPortalRideHistoryPage() {
  const navigate = useNavigate();
  const [rides, setRides] = useState<RiderGuardianPortalRideRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      setLoading(true);
      setError(null);
      try {
        const response = await riderGuardianPortalApi.searchRides({
          size: 50,
          sortBy: "scheduledPickupAt",
          sortDirection: "DESC",
        });
        if (!cancelled) {
          setRides(response.items.filter(isHistoryRide));
        }
      } catch {
        if (!cancelled) {
          setError("Ride history could not be loaded.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <LoadingState />;
  }

  return (
    <Stack spacing={2.5}>
      <PageCard>
        <Stack spacing={1}>
          <Typography variant="h4">Ride History</Typography>
          <Typography color="text.secondary">
            Review past rides within your rider or guardian scope without
            exposing unrelated rider records.
          </Typography>
        </Stack>
      </PageCard>
      {error ? <Alert severity="error">{error}</Alert> : null}
      {rides.length === 0 ? (
        <PageCard>
          <Typography color="text.secondary">
            No ride history is available yet.
          </Typography>
        </PageCard>
      ) : (
        rides.map((ride) => (
          <PageCard key={ride.id}>
            <Stack spacing={1.5}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                spacing={1}
              >
                <Stack spacing={0.5}>
                  <Typography variant="h6">{ride.rideNumber}</Typography>
                  <Typography color="text.secondary">
                    Viewing rider: {ride.riderName}
                  </Typography>
                </Stack>
                <Chip
                  label={ride.status.replaceAll("_", " ")}
                  color="secondary"
                  sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
                />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Pickup: {formatDateTime(ride.scheduledPickupAt)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Organization: {ride.organizationName ?? "Not provided"}
              </Typography>
              <Button
                variant="outlined"
                endIcon={<ArrowForwardRoundedIcon />}
                onClick={() => navigate(`/portal/rider/rides/${ride.id}`)}
              >
                Open ride detail
              </Button>
            </Stack>
          </PageCard>
        ))
      )}
    </Stack>
  );
}
