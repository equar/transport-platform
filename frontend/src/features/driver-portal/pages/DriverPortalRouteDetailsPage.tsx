import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import {
  Alert,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import {
  driverPortalApi,
  type DriverPortalRouteDetailRecord,
} from "../api/driverPortalApi";
import { LoadingState } from "../../../shared/components/LoadingState";
import { PageCard } from "../../../shared/components/PageCard";
import { SectionHeader } from "../../../shared/components/SectionHeader";
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
    <Stack spacing={3}>
      <Button
        component={RouterLink}
        to="/portal/driver/routes"
        startIcon={<ArrowBackRoundedIcon />}
        sx={{ alignSelf: "flex-start" }}
      >
        Back to routes
      </Button>
      <SectionHeader
        title={
          route ? `${route.routeCode} · ${route.routeName}` : "Route Detail"
        }
        description="Review manifest notes and ordered stops for the assigned route."
      />
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
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Ride</TableCell>
                    <TableCell>Rider</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Pickup</TableCell>
                    <TableCell>Dropoff</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {route.stops.map((stop) => (
                    <TableRow key={stop.id} hover>
                      <TableCell>{stop.stopSequence}</TableCell>
                      <TableCell>{stop.rideNumber}</TableCell>
                      <TableCell>{stop.riderName}</TableCell>
                      <TableCell>
                        <StatusChip value={stop.status} />
                      </TableCell>
                      <TableCell>
                        {formatDateTime(stop.plannedPickupAt)}
                      </TableCell>
                      <TableCell>
                        {formatDateTime(stop.plannedDropoffAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Stack>
          </PageCard>
        </>
      ) : null}
    </Stack>
  );
}
