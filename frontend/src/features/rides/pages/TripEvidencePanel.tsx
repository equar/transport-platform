import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Stack,
  TextField,
  Typography,
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import {
  apiClient,
  unwrapResponse,
  getApiErrorMessage,
} from "../../../shared/api/client";
import { PageCard } from "../../../shared/components/PageCard";
import { formatDateTime } from "../../../shared/utils/format";
interface Stops {
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffLatitude: number;
  dropoffLongitude: number;
}
export interface Evidence {
  stops: Stops | null;
  milestones: {
    id: number;
    milestone: string;
    distanceMeters: number;
    accuracyMeters: number;
    odometerMiles: number | null;
    recordedAt: string;
    consumedAt: string | null;
  }[];
  confirmation: {
    confirmerName: string;
    subjectType: string;
    confirmedAt: string;
  } | null;
  readyToComplete: boolean;
}
const labels = {
  pickupLatitude: "Pickup latitude",
  pickupLongitude: "Pickup longitude",
  dropoffLatitude: "Drop-off latitude",
  dropoffLongitude: "Drop-off longitude",
};
export function TripEvidencePanel({
  rideId,
  status,
}: {
  rideId: number;
  status: string;
}) {
  const [data, setData] = useState<Evidence | null>(null),
    [error, setError] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [refresh, setRefresh] = useState(0);
  const [fields, setFields] = useState({
    pickupLatitude: "",
    pickupLongitude: "",
    dropoffLatitude: "",
    dropoffLongitude: "",
  });
  const base = `/company/rides/${rideId}/delivery-evidence`;
  useEffect(() => {
    let active = true;
    setData(null);
    setLoading(true);
    void apiClient
      .get(base)
      .then((r) => {
        if (!active) return;
        const e = unwrapResponse<Evidence>(r.data);
        setData(e);
        if (e.stops)
          setFields(
            Object.fromEntries(
              Object.entries(e.stops).map(([k, v]) => [k, String(v)]),
            ) as typeof fields,
          );
        if (!e.stops)
          setFields({
            pickupLatitude: "",
            pickupLongitude: "",
            dropoffLatitude: "",
            dropoffLongitude: "",
          });
        setError(null);
      })
      .catch((e) => {
        if (active)
          setError(
            getApiErrorMessage(e, "Delivery evidence could not be loaded."),
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [base, status, refresh]);
  const editable =
    [
      "DRAFT",
      "REQUESTED",
      "PENDING_REVIEW",
      "SCHEDULED",
      "ASSIGNED",
      "DRIVER_EN_ROUTE",
    ].includes(status) && data?.milestones.length === 0;
  async function save() {
    const parsed = Object.fromEntries(
      Object.entries(fields).map(([k, v]) => [k, Number(v)]),
    );
    if (
      Object.values(fields).some((v) => !v.trim()) ||
      Object.entries(parsed).some(
        ([k, v]) =>
          !Number.isFinite(v) ||
          Math.abs(v) > (k.endsWith("Latitude") ? 90 : 180),
      )
    ) {
      setError("Enter valid latitude and longitude for both booked addresses.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const r = await apiClient.put(base + "/stops", parsed);
      setData(unwrapResponse<Evidence>(r.data));
    } catch (e) {
      setError(getApiErrorMessage(e, "Verified stops could not be saved."));
    } finally {
      setBusy(false);
    }
  }
  return (
    <PageCard>
      <Stack spacing={2}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h5">Delivery evidence</Typography>
          <Button
            disabled={loading || busy}
            onClick={() => setRefresh((v) => v + 1)}
          >
            Refresh
          </Button>
        </Stack>
        {error ? <Alert severity="error">{error}</Alert> : null}
        {loading ? (
          <Typography role="status">Loading delivery evidence…</Typography>
        ) : data ? (
          <>
            <Alert severity={data.readyToComplete ? "success" : "info"}>
              {data.readyToComplete
                ? "Milestone evidence and passenger delivery confirmation are recorded."
                : "Completion, ride billing and earnings require verified milestones and confirmation in the rider or authorized guardian’s own app."}
            </Alert>
            <Typography variant="body2">
              Verify these coordinates against the booked pickup and drop-off
              addresses before departure. The driver must be within 200 meters
              of each stop, including GPS uncertainty. Stops lock after the
              first evidence capture; address changes require verification
              again.
            </Typography>
            {editable ? (
              <Box
                component="form"
                onSubmit={(e) => {
                  e.preventDefault();
                  void save();
                }}
              >
                <Stack spacing={2}>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                      gap: 2,
                    }}
                  >
                    {(Object.keys(labels) as (keyof Stops)[]).map((k) => (
                      <TextField
                        key={k}
                        required
                        label={labels[k]}
                        value={fields[k]}
                        onChange={(e) =>
                          setFields((f) => ({ ...f, [k]: e.target.value }))
                        }
                        disabled={busy}
                        inputProps={{ inputMode: "decimal" }}
                      />
                    ))}
                  </Box>
                  <Button
                    type="submit"
                    disabled={busy}
                    variant="outlined"
                    sx={{ alignSelf: "flex-start" }}
                  >
                    Verify booked stop coordinates
                  </Button>
                </Stack>
              </Box>
            ) : (
              <Typography>
                {data.stops
                  ? `Verified pickup: ${data.stops.pickupLatitude}, ${data.stops.pickupLongitude} · drop-off: ${data.stops.dropoffLatitude}, ${data.stops.dropoffLongitude}`
                  : "Stop coordinates have not been verified. Contact dispatch; unverified rides cannot be completed or billed."}
              </Typography>
            )}
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Milestone</TableCell>
                    <TableCell>Distance / GPS accuracy</TableCell>
                    <TableCell>Odometer (miles)</TableCell>
                    <TableCell>Recorded / Applied</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.milestones.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.milestone.replaceAll("_", " ")}</TableCell>
                      <TableCell>
                        {m.distanceMeters.toFixed(0)} m / ±
                        {m.accuracyMeters.toFixed(0)} m
                      </TableCell>
                      <TableCell>{m.odometerMiles ?? "—"}</TableCell>
                      <TableCell>
                        {formatDateTime(m.recordedAt)}
                        <Typography variant="body2">
                          {m.consumedAt
                            ? "Applied " + formatDateTime(m.consumedAt)
                            : "Not applied to trip status"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
            {!data.milestones.length ? (
              <Typography>No location milestones recorded.</Typography>
            ) : null}
            <Typography>
              {data.confirmation
                ? `Delivery confirmed by ${data.confirmation.confirmerName} (${data.confirmation.subjectType.toLowerCase()}) at ${formatDateTime(data.confirmation.confirmedAt)}.`
                : "No rider or guardian delivery confirmation recorded. Dispatch cannot confirm on their behalf."}
            </Typography>
          </>
        ) : null}
      </Stack>
    </PageCard>
  );
}
