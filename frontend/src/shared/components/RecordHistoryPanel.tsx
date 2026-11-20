import { useEffect, useState } from "react";
import {
  useMediaQuery,
  useTheme,
  Alert,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Box,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import {
  auditLogsApi,
  type AuditLogRecord,
} from "../../features/audit/api/auditLogsApi";
import { AuditLogDetailsDialog } from "../../features/audit/components/AuditLogDetailsDialog";
import { ridesApi, type RideRecord } from "../../features/rides/api/ridesApi";
import { isCompanyAdmin, isPlatformAdmin } from "../../features/auth/access";
import { useAuth } from "../../features/auth/context/AuthContext";
import { getApiErrorMessage } from "../api/client";
import { formatDateTime } from "../utils/format";
import { PageCard } from "./PageCard";
import { StatusChip } from "./StatusChip";

interface Props {
  entityType: "DRIVER" | "RIDER" | "GUARDIAN" | "RIDE";
  entityId: number;
  updatedAt?: string;
}

export function RecordHistoryPanel(props: Props) {
  const { session } = useAuth();
  return (
    <Stack spacing={3}>
      {props.entityType !== "RIDE" ? (
        <HistorySection {...props} kind="rides" />
      ) : null}
      {isCompanyAdmin(session) || isPlatformAdmin(session) ? (
        <HistorySection {...props} kind="audit" />
      ) : null}
    </Stack>
  );
}

function HistorySection({
  entityType,
  entityId,
  updatedAt,
  kind,
}: Props & { kind: "rides" | "audit" }) {
  const narrow = useMediaQuery(useTheme().breakpoints.down("sm"));
  const [page, setPage] = useState(0),
    [size, setSize] = useState(10),
    [total, setTotal] = useState(0);
  const [items, setItems] = useState<(AuditLogRecord | RideRecord)[]>([]);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0),
    [selected, setSelected] = useState<AuditLogRecord | null>(null);
  useEffect(() => {
    setPage(0);
    setSelected(null);
  }, [entityId, entityType]);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setItems([]);
    const request =
      kind === "rides"
        ? ridesApi.history(entityType, entityId, page, size)
        : auditLogsApi.search({
            entityType,
            entityId: String(entityId),
            keyword: "",
            module: "",
            action: "",
            createdFrom: "",
            createdTo: "",
            page,
            size,
          });
    void request
      .then((result) => {
        if (active) {
          if (page > 0 && page * size >= result.totalElements) {
            setPage(Math.max(0, Math.ceil(result.totalElements / size) - 1));
            return;
          }
          setItems(result.items);
          setTotal(result.totalElements);
        }
      })
      .catch((cause) => {
        if (active) {
          setTotal(0);
          setError(getApiErrorMessage(cause, "History could not be loaded."));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [entityType, entityId, kind, page, size, updatedAt, retry]);
  return (
    <PageCard>
      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          gap={1}
        >
          <Typography variant="h5">
            {kind === "rides" ? "Ride History" : "Activity History"}
          </Typography>
          <Button
            onClick={() => setRetry((value) => value + 1)}
            disabled={loading}
          >
            Refresh history
          </Button>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {kind === "rides"
            ? entityType === "GUARDIAN"
              ? "Scheduled, active and historical rides for this guardian and currently linked riders. Open a ride for assignments, milestones and notes. Link and unlink changes remain in Activity History."
              : "Scheduled, active and historical rides associated with this record. Open a ride for assignments, milestones and notes. Previous assignment changes are available in Activity History."
            : "Recorded changes to this record and related activity, including previous and new values. Older events contain only the details captured when they occurred."}
        </Typography>
        {error ? (
          <Alert
            severity="error"
            action={
              <Button onClick={() => setRetry((value) => value + 1)}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        ) : loading ? (
          <Typography role="status">Loading history…</Typography>
        ) : !items.length ? (
          <Typography color="text.secondary">
            No {kind === "rides" ? "rides" : "recorded activity"} found.
          </Typography>
        ) : narrow ? (
          <Stack spacing={1.5}>
            {items.map((item) => {
              if (kind === "rides") {
                const ride = item as RideRecord;
                return (
                  <Box
                    key={ride.id}
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1,
                      p: 2,
                      overflowWrap: "anywhere",
                    }}
                  >
                    <Stack spacing={1}>
                      <Typography fontWeight={700}>
                        {ride.rideNumber} · {ride.riderName}
                      </Typography>
                      <Typography variant="body2">
                        {formatDateTime(ride.scheduledPickupAt)}
                      </Typography>
                      <StatusChip value={ride.status} />
                      <Typography variant="body2">
                        {[ride.pickupAddressLine1, ride.pickupCity]
                          .filter(Boolean)
                          .join(", ")}{" "}
                        →{" "}
                        {[ride.dropoffAddressLine1, ride.dropoffCity]
                          .filter(Boolean)
                          .join(", ")}
                      </Typography>
                      <Button
                        component={RouterLink}
                        to={`/company/rides/${ride.id}`}
                      >
                        View ride
                      </Button>
                    </Stack>
                  </Box>
                );
              }
              const event = item as AuditLogRecord;
              return (
                <Box
                  key={event.id}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    p: 2,
                    overflowWrap: "anywhere",
                  }}
                >
                  <Stack spacing={1}>
                    <Typography fontWeight={700}>
                      {event.module.replaceAll("_", " ")} ·{" "}
                      {event.action.replaceAll("_", " ")}
                    </Typography>
                    <Typography variant="body2">
                      {formatDateTime(event.createdAt)} ·{" "}
                      {event.actorName || event.actorEmail || "System"}
                    </Typography>
                    <Typography variant="body2">{event.summary}</Typography>
                    <Button onClick={() => setSelected(event)}>
                      View changes
                    </Button>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>
                    {kind === "rides" ? "Ride / Rider" : "Activity / Actor"}
                  </TableCell>
                  <TableCell>
                    {kind === "rides" ? "Status / Route" : "Summary"}
                  </TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) =>
                  kind === "rides"
                    ? (() => {
                        const ride = item as RideRecord;
                        return (
                          <TableRow key={ride.id}>
                            <TableCell>
                              {formatDateTime(ride.scheduledPickupAt)}
                            </TableCell>
                            <TableCell>
                              {ride.rideNumber}
                              <Typography variant="body2">
                                {ride.riderName}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <StatusChip value={ride.status} />
                              <Typography variant="body2">
                                {[ride.pickupAddressLine1, ride.pickupCity]
                                  .filter(Boolean)
                                  .join(", ")}{" "}
                                →{" "}
                                {[ride.dropoffAddressLine1, ride.dropoffCity]
                                  .filter(Boolean)
                                  .join(", ")}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Button
                                component={RouterLink}
                                to={`/company/rides/${ride.id}`}
                              >
                                View ride
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })()
                    : (() => {
                        const event = item as AuditLogRecord;
                        return (
                          <TableRow key={event.id}>
                            <TableCell>
                              {formatDateTime(event.createdAt)}
                            </TableCell>
                            <TableCell>
                              {event.module.replaceAll("_", " ")} ·{" "}
                              {event.action.replaceAll("_", " ")}
                              <Typography variant="body2">
                                {event.actorName ||
                                  event.actorEmail ||
                                  "System"}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ overflowWrap: "anywhere" }}>
                              {event.summary}
                            </TableCell>
                            <TableCell>
                              <Button onClick={() => setSelected(event)}>
                                View changes
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })(),
                )}
              </TableBody>
            </Table>
          </Box>
        )}
        <TablePagination
          sx={{
            ".MuiTablePagination-toolbar": {
              flexWrap: "wrap",
              justifyContent: "flex-end",
              px: 0,
            },
            ".MuiTablePagination-spacer": { display: "none" },
            ".MuiTablePagination-actions": { ml: { xs: 0, sm: 2 } },
          }}
          component="div"
          count={total}
          page={page}
          rowsPerPage={size}
          rowsPerPageOptions={[10, 25, 50]}
          onPageChange={(_, next) => setPage(next)}
          onRowsPerPageChange={(event) => {
            setSize(Number(event.target.value));
            setPage(0);
          }}
        />
      </Stack>
      <AuditLogDetailsDialog
        open={Boolean(selected)}
        record={selected}
        onClose={() => setSelected(null)}
      />
    </PageCard>
  );
}
