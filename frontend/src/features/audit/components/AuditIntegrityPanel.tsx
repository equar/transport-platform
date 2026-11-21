import { useEffect, useRef, useState } from "react";
import { Alert, Button, Stack, TextField, Typography } from "@mui/material";
import {
  apiClient,
  getApiErrorMessage,
  unwrapResponse,
} from "../../../shared/api/client";
import { useAuth } from "../../auth/context/AuthContext";
import { isPlatformAdmin } from "../../auth/access";
import { PageCard } from "../../../shared/components/PageCard";
interface Result {
  scope: string;
  headSequence: number;
  headSignature: string;
  verifiedThrough: number;
  hasMore: boolean;
  unsealedRecords: number;
  externalAnchorChecked: boolean;
  issues: string[];
}
export function AuditIntegrityPanel() {
  const { session } = useAuth();
  const platform = isPlatformAdmin(session);
  const [tenant, setTenant] = useState(""),
    [sequence, setSequence] = useState(""),
    [signature, setSignature] = useState("");
  const [result, setResult] = useState<Result | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  async function verify() {
    if (
      (sequence || signature) &&
      (!/^\d+$/.test(sequence) ||
        Number(sequence) < 1 ||
        !/^[a-f0-9]{64}$/.test(signature))
    ) {
      setError(
        "Provide a positive checkpoint sequence and its 64-character signature from independent logs.",
      );
      return;
    }
    setBusy(true);
    setError("");
    setResult(null);
    try {
      let after = 0;
      const issues: string[] = [];
      for (let page = 0; page < 100 && active.current; page++) {
        const response = await apiClient.get("/audit-logs/integrity", {
          params: {
            after,
            ...(platform && tenant ? { tenantId: tenant.trim() } : {}),
            ...(sequence
              ? {
                  expectedSequence: Number(sequence),
                  expectedSignature: signature,
                }
              : {}),
          },
        });
        const report = unwrapResponse<Result>(response.data);
        issues.push(...report.issues);
        if (!active.current) return;
        setResult({ ...report, issues: [...issues] });
        if (issues.length || !report.hasMore || report.verifiedThrough <= after)
          break;
        after = report.verifiedThrough;
      }
    } catch (e) {
      if (active.current)
        setError(
          getApiErrorMessage(
            e,
            "Audit integrity verification could not be completed.",
          ),
        );
    } finally {
      if (active.current) setBusy(false);
    }
  }
  return (
    <PageCard>
      <Stack spacing={2}>
        <Typography variant="h6">Verify audit integrity</Typography>
        <Typography variant="body2">
          Checks signed records for changes, missing entries and unauthorized
          deletion. A previously saved checkpoint from independent logs is
          needed to detect rollback across server restarts.
        </Typography>
        {platform ? (
          <TextField
            label="Company tenant ID (blank for platform history)"
            value={tenant}
            onChange={(e) => setTenant(e.target.value)}
            disabled={busy}
          />
        ) : null}
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            label="Independent checkpoint sequence (optional)"
            value={sequence}
            onChange={(e) => setSequence(e.target.value)}
            inputProps={{ inputMode: "numeric" }}
            disabled={busy}
            fullWidth
          />
          <TextField
            label="Independent checkpoint signature (optional)"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            disabled={busy}
            fullWidth
          />
        </Stack>
        <Button onClick={() => void verify()} disabled={busy}>
          {busy ? "Verifying…" : "Verify signed history"}
        </Button>
        {error ? <Alert severity="error">{error}</Alert> : null}
        {result ? (
          <>
            <Alert
              severity={
                result.issues.length
                  ? "error"
                  : result.hasMore
                    ? "warning"
                    : "success"
              }
            >
              {result.issues.length
                ? result.issues.join(", ")
                : result.hasMore
                  ? "Partial verification completed. Continue verification through the API for larger histories."
                  : "Signed records passed integrity verification."}{" "}
              Verified through sequence {result.verifiedThrough}.
            </Alert>
            {result.unsealedRecords > 0 ? (
              <Alert severity="warning">
                {result.unsealedRecords} older records have no signature. Their
                historical authenticity has not been established.
              </Alert>
            ) : null}
            {!result.externalAnchorChecked ? (
              <Alert severity="info">
                No independent checkpoint was checked. A complete or tail
                rollback across a server restart cannot be ruled out.
              </Alert>
            ) : null}
            <Typography variant="caption">
              Current checkpoint: {result.headSequence} · {result.headSignature}
            </Typography>
          </>
        ) : null}
      </Stack>
    </PageCard>
  );
}
