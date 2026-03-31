import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import {
  Alert,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  driverPortalApi,
  type DriverPortalRideStatus,
  type DriverPortalRideSummaryRecord,
} from "../api/driverPortalApi";
import { AdminFilterBar } from "../../../shared/components/AdminFilterBar";
import { LoadingState } from "../../../shared/components/LoadingState";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { StatusChip } from "../../../shared/components/StatusChip";
import { TableActionButton } from "../../../shared/components/TableActionButton";
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
    <Stack spacing={3}>
      <SectionHeader
        title="Assigned Rides"
        description="Review your upcoming and in-progress trips, then open ride detail to update status."
      />
      <AdminFilterBar>
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
              {option || "All statuses"}
            </MenuItem>
          ))}
        </TextField>
      </AdminFilterBar>
      {loading ? <LoadingState /> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      {!loading ? (
        <Stack spacing={0}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ride</TableCell>
                <TableCell>Rider</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Pickup</TableCell>
                <TableCell>Dropoff</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((ride) => (
                <TableRow key={ride.id} hover>
                  <TableCell>{ride.rideNumber}</TableCell>
                  <TableCell>{ride.riderName}</TableCell>
                  <TableCell>
                    <StatusChip value={ride.status} />
                  </TableCell>
                  <TableCell>
                    {formatDateTime(ride.scheduledPickupAt)}
                  </TableCell>
                  <TableCell>{ride.dropoffAddress ?? "-"}</TableCell>
                  <TableCell align="right">
                    <TableActionButton
                      title="Open ride detail"
                      onClick={() =>
                        navigate(`/portal/driver/rides/${ride.id}`)
                      }
                    >
                      <VisibilityRoundedIcon />
                    </TableActionButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
