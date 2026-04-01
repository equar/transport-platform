import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import {
  Alert,
  Box,
  Button,
  Chip,
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
  type DriverPortalRouteStatus,
  type DriverPortalRouteSummaryRecord,
} from "../api/driverPortalApi";
import { LoadingState } from "../../../shared/components/LoadingState";
import { PageCard } from "../../../shared/components/PageCard";

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
    <Stack spacing={2.5}>
      <PageCard>
        <Stack spacing={1}>
          <Typography variant="h4">My Routes</Typography>
          <Typography color="text.secondary">
            Review assigned route manifests and open route details for your
            daily stops.
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
        </Box>
      </PageCard>
      {loading ? <LoadingState /> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      {!loading ? (
        <Stack spacing={2}>
          {items.map((route) => (
            <PageCard key={route.id}>
              <Stack spacing={1.5}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  spacing={1.5}
                >
                  <Stack spacing={0.5}>
                    <Typography variant="h6">
                      {route.routeCode} · {route.routeName}
                    </Typography>
                    <Typography color="text.secondary">
                      {route.routeDate}
                    </Typography>
                  </Stack>
                  <Chip
                    label={route.status.replaceAll("_", " ")}
                    color="secondary"
                    sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
                  />
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Linked rides: {route.linkedRideCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Start: {route.startTime ?? "Not set"} · End:{" "}
                  {route.endTime ?? "Not set"}
                </Typography>
                <Button
                  variant="outlined"
                  endIcon={<ArrowForwardRoundedIcon />}
                  onClick={() => navigate(`/portal/driver/routes/${route.id}`)}
                >
                  Open route
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
