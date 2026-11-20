import { useEffect, useState } from "react";
import { Alert, Button, Stack, Typography } from "@mui/material";
import {
  apiClient,
  unwrapResponse,
  getApiErrorMessage,
} from "../../../shared/api/client";
import { PageCard } from "../../../shared/components/PageCard";
import { ConfirmDialog } from "../../../shared/components/ConfirmDialog";
import type { Evidence } from "./TripEvidencePanel";
export function PortalDeliveryEvidence({
  rideId,
  status,
  driver = false,
  destination,
}: {
  rideId: number;
  status: string;
  driver?: boolean;
  destination?: string | null;
}) {
  const [data, setData] = useState<(Evidence & { canConfirm: boolean }) | null>(
      null,
    ),
    [error, setError] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [confirming, setConfirming] = useState(false),
    [refresh, setRefresh] = useState(0);
  const base = `/portal/${driver ? "driver" : "rider"}/rides/${rideId}/delivery-evidence`;
  useEffect(() => {
    let active = true;
    setData(null);
    setConfirming(false);
    void apiClient
      .get(base)
      .then((r) => {
        if (active) {
          setData(unwrapResponse(r.data));
          setError(null);
        }
      })
      .catch((e) => {
        if (active)
          setError(
            getApiErrorMessage(e, "Delivery evidence could not be loaded."),
          );
      });
    return () => {
      active = false;
    };
  }, [base, status, refresh]);
  const drop = data?.milestones
    .filter((m) => m.milestone === "DROPPED_OFF" && m.consumedAt)
    .slice(-1)[0];
  async function confirm() {
    if (!drop) return;
    setBusy(true);
    try {
      const r = await apiClient.post(base + "/confirm", {
        dropoffEvidenceId: drop.id,
        delivered: true,
      });
      setData(unwrapResponse(r.data));
      setError(null);
      setConfirming(false);
    } catch (e) {
      setError(getApiErrorMessage(e, "Delivery could not be confirmed."));
    } finally {
      setBusy(false);
    }
  }
  return (
    <PageCard>
      <Stack spacing={2}>
        <Typography variant="h5">Delivery verification</Typography>
        {error ? <Alert severity="error">{error}</Alert> : null}
        {data?.confirmation ? (
          <Alert severity="success">
            Delivery confirmed by {data.confirmation.confirmerName} (
            {data.confirmation.subjectType.toLowerCase()}).
          </Alert>
        ) : (
          <Typography>
            {driver
              ? "Completion requires the rider or an authorized guardian to confirm delivery from their own account."
              : "Confirm only when you know the rider has safely arrived at the booked destination."}
          </Typography>
        )}
        {driver && !data?.stops ? (
          <Alert severity="warning">
            Dispatch must verify stop coordinates before departure.
          </Alert>
        ) : null}
        <Typography>
          Booked destination: {destination || "See trip details"}
        </Typography>
        {!driver && data?.canConfirm && drop ? (
          <Button
            disabled={busy}
            variant="contained"
            onClick={() => setConfirming(true)}
          >
            Confirm rider was delivered
          </Button>
        ) : null}
        <Button onClick={() => setRefresh((v) => v + 1)} disabled={busy}>
          Refresh delivery evidence
        </Button>
        <ConfirmDialog
          open={confirming}
          title="Confirm delivery"
          description={`Has the rider arrived safely at ${destination || "the booked destination"}? Confirm only if you know this delivery occurred.`}
          confirmLabel="Yes, confirm delivery"
          loading={busy}
          onCancel={() => setConfirming(false)}
          onConfirm={() => void confirm()}
        />
      </Stack>
    </PageCard>
  );
}
