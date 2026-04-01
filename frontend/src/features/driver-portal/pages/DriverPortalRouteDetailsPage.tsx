import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import FmdGoodRoundedIcon from "@mui/icons-material/FmdGoodRounded";
import { Alert, Button, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import {
  driverPortalApi,
  type DriverPortalRouteDetailRecord,
} from "../api/driverPortalApi";
import { LoadingState } from "../../../shared/components/LoadingState";
import { PageCard } from "../../../shared/components/PageCard";
import { StatusChip } from "../../../shared/components/StatusChip";
import { formatDateTime } from "../../../shared/utils/format";

export function DriverPortalRouteDetailsPage() {
  const { routeId } = useParams();
  const resolvedRouteId = Number(routeId);
  const [route, setRoute] = useState<DriverPortalRouteDetailRecord | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await driverPortalApi.getRoute(resolvedRouteId);
        if (!cancelled) {
          setRoute(response);
        }
      } catch {
        if (!cancelled) {
          setError("Route detail could not be loaded.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    if (Number.isFinite(resolvedRouteId)) {
      void load();
    }
    return () => {
      cancelled = true;
    };
  }, [resolvedRouteId]);

  if (loading) {
    return <LoadingState />;
  }

  return (
    <Stack spacing={2.5}>
      <Button
        component={RouterLink}
        to="/portal/driver/routes"
        startIcon={<ArrowBackRoundedIcon />}
        sx={{ alignSelf: "flex-start" }}
      >
        Back to routes
      </Button>
      <PageCard>
        <Stack spacing={1}>
          <Typography variant="h4">
            {route ? `${route.routeCode} · ${route.routeName}` : "Route detail"}
          </Typography>
          <Typography color="text.secondary">
            Review your route overview, manifest notes, and ordered stops for
            the assigned route only.
          </Typography>
        </Stack>
      </PageCard>
      {error ? <Alert severity="error">{error}</Alert> : null}
      {route ? (
        <>
          <PageCard>
            <Stack spacing={1.5}>
              <Typography variant="h5">Route Overview</Typography>
              <Typography>Date: {route.routeDate}</Typography>
              <Typography>Service type: {route.serviceType}</Typography>
              <Typography>
                Status: <StatusChip value={route.status} />
              </Typography>
              <Typography>
                Manifest notes: {route.manifestNotes ?? "-"}
              </Typography>
              <Typography>Notes: {route.notes ?? "-"}</Typography>
            </Stack>
          </PageCard>
          <PageCard>
            <Stack spacing={2}>
              <Typography variant="h5">Stops</Typography>
              <Stack spacing={1.5}>
                {route.stops.map((stop) => (
                  <PageCard key={stop.id} sx={{ p: { xs: 2, md: 2.5 } }}>
                    <Stack spacing={1.25}>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        justifyContent="space-between"
                        spacing={1}
                      >
                        <Typography variant="h6">
                          Stop {stop.stopSequence} · {stop.rideNumber}
                        </Typography>
                        <StatusChip value={stop.status} />
                      </Stack>
                      <Typography color="text.secondary">
                        {stop.riderName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Pickup: {formatDateTime(stop.plannedPickupAt)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Dropoff: {formatDateTime(stop.plannedDropoffAt)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Pickup address: {stop.pickupAddress ?? "Not available"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Dropoff address:{" "}
                        {stop.dropoffAddress ?? "Not available"}
                      </Typography>
                    </Stack>
                  </PageCard>
                ))}
              </Stack>
            </Stack>
          </PageCard>
        </>
      ) : null}
    </Stack>
  );
}
