import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Stack,
  TablePagination,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  driverPortalApi,
  type DriverPortalRideStatus,
  type DriverPortalRideSummaryRecord,
} from "../api/driverPortalApi";
import { LoadingState } from "../../../shared/components/LoadingState";
import { PageCard } from "../../../shared/components/PageCard";
import {
  formatStatusLabel,
  StatusChip,
} from "../../../shared/components/StatusChip";
import { formatDateTime } from "../../../shared/utils/format";

const rideStatuses: Array<DriverPortalRideStatus | ""> = [
  "",
  "ASSIGNED",
  "DRIVER_EN_ROUTE",
  "ARRIVED",
  "PICKED_UP",
  "DROPPED_OFF",
  "COMPLETED",
  "RIDER_NO_SHOW",
  "FAILED",
];

export function DriverPortalRidesPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<DriverPortalRideSummaryRecord[]>([]);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<DriverPortalRideStatus | "">("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await driverPortalApi.searchRides({
          keyword,
          status,
          page,
          size,
          sortBy: "scheduledPickupAt",
          sortDirection: "ASC",
        });
        if (!cancelled) {
          setItems(response.items);
          setTotal(response.totalElements);
        }
      } catch {
        if (!cancelled) {
          setError("Assigned rides could not be loaded.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [keyword, page, size, status]);

  return (
    <Stack spacing={2.5}>
      <PageCard>
        <Stack spacing={1}>
          <Typography variant="h4">My Rides</Typography>
          <Typography color="text.secondary">
            Review your assigned trips and open each ride to update progress in
            the field.
          </Typography>
        </Stack>
      </PageCard>
      <PageCard>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
          }}
        >
          <TextField
            label="Search"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            fullWidth
          />
          <TextField
            select
            label="Status"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as DriverPortalRideStatus | "")
            }
            sx={{ minWidth: 220 }}
          >
            {rideStatuses.map((option) => (
              <MenuItem key={option || "all"} value={option}>
                {option ? formatStatusLabel(option) : "All statuses"}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </PageCard>
      {loading ? <LoadingState /> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      {!loading ? (
        <Stack spacing={2}>
          {items.map((ride) => (
            <PageCard key={ride.id}>
              <Stack spacing={1.5}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  spacing={1.5}
                >
                  <Stack spacing={0.5}>
                    <Typography variant="h6">{ride.rideNumber}</Typography>
                    <Typography color="text.secondary">
                      {ride.riderName}
                    </Typography>
                  </Stack>
                  <StatusChip
                    value={ride.status}
                    sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
                  />
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Pickup: {formatDateTime(ride.scheduledPickupAt)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pickup address: {ride.pickupAddress ?? "Not available"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Dropoff address: {ride.dropoffAddress ?? "Not available"}
                </Typography>
                <Button
                  variant="outlined"
                  endIcon={<ArrowForwardRoundedIcon />}
                  onClick={() => navigate(`/portal/driver/rides/${ride.id}`)}
                >
                  Open ride
                </Button>
              </Stack>
            </PageCard>
          ))}
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, nextPage) => setPage(nextPage)}
            rowsPerPage={size}
            onRowsPerPageChange={(event) => {
              setSize(Number(event.target.value));
              setPage(0);
            }}
          />
        </Stack>
      ) : null}
    </Stack>
  );
}
