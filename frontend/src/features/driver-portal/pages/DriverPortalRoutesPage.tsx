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
  type DriverPortalRouteStatus,
  type DriverPortalRouteSummaryRecord,
} from "../api/driverPortalApi";
import { AdminFilterBar } from "../../../shared/components/AdminFilterBar";
import { LoadingState } from "../../../shared/components/LoadingState";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { StatusChip } from "../../../shared/components/StatusChip";
import { TableActionButton } from "../../../shared/components/TableActionButton";

const routeStatuses: Array<DriverPortalRouteStatus | ""> = [
  "",
  "PLANNED",
  "READY",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

export function DriverPortalRoutesPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<DriverPortalRouteSummaryRecord[]>([]);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<DriverPortalRouteStatus | "">("");
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
        const response = await driverPortalApi.searchRoutes({
          keyword,
          status,
          page,
          size,
          sortBy: "routeDate",
          sortDirection: "DESC",
        });
        if (!cancelled) {
          setItems(response.items);
          setTotal(response.totalElements);
        }
      } catch {
        if (!cancelled) {
          setError("Assigned routes could not be loaded.");
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
        title="Assigned Routes"
        description="Open route manifests and stop sequencing for the routes assigned to your profile."
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
            setStatus(event.target.value as DriverPortalRouteStatus | "")
          }
          sx={{ minWidth: 220 }}
        >
          {routeStatuses.map((option) => (
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
                <TableCell>Route</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Rides</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((route) => (
                <TableRow key={route.id} hover>
                  <TableCell>
                    {route.routeCode} · {route.routeName}
                  </TableCell>
                  <TableCell>{route.routeDate}</TableCell>
                  <TableCell>
                    <StatusChip value={route.status} />
                  </TableCell>
                  <TableCell>{route.linkedRideCount}</TableCell>
                  <TableCell align="right">
                    <TableActionButton
                      title="Open route detail"
                      onClick={() =>
                        navigate(`/portal/driver/routes/${route.id}`)
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
