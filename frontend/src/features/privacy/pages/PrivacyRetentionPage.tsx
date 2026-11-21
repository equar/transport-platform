import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Stack,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../../auth/context/AuthContext";
import { isPlatformAdmin } from "../../auth/access";
import {
  apiClient,
  unwrapResponse,
  getApiErrorMessage,
} from "../../../shared/api/client";
import { PageCard } from "../../../shared/components/PageCard";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { ConfirmDialog } from "../../../shared/components/ConfirmDialog";
import { formatDateTime } from "../../../shared/utils/format";
interface Policy {
  scope: string;
  operationalReviewDays: number | null;
  auditDays: number | null;
  notificationDays: number | null;
  cleanupEnabled: boolean | null;
  legalHold: boolean;
  locationDays?: number | null;
}
interface PolicyView {
  platform: Policy;
  override: Policy;
  effective: Policy;
  platformScope: boolean;
}
interface Review {
  entityType: "RIDER" | "RIDE";
  entityId: number;
  lastActivity: string;
}
export function PrivacyRetentionPage() {
  const { session } = useAuth(),
    platform = isPlatformAdmin(session),
    base = `/${platform ? "platform" : "company"}/privacy-retention`;
  const [data, setData] = useState<PolicyView | null>(null),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null),
    [notice, setNotice] = useState<string | null>(null),
    [revision, setRevision] = useState(0);
  const [reviewDays, setReviewDays] = useState(""),
    [auditDays, setAuditDays] = useState(""),
    [locationDays, setLocationDays] = useState(""),
    [notificationDays, setNotificationDays] = useState(""),
    [enabled, setEnabled] = useState("inherit"),
    [hold, setHold] = useState(false),
    [confirm, setConfirm] = useState(false);
  const [candidates, setCandidates] = useState<Review[]>([]),
    [review, setReview] = useState<Review | null>(null),
    [reason, setReason] = useState("LEGAL_RECORDKEEPING");
  useEffect(() => {
    let active = true;
    setLoading(true);
    setData(null);
    void Promise.all([
      apiClient.get(base),
      platform
        ? Promise.resolve(null)
        : apiClient.get(base + "/review-candidates"),
    ])
      .then(([response, reviews]) => {
        if (!active) return;
        const p = unwrapResponse<PolicyView>(response.data);
        setData(p);
        setReviewDays(p.override.operationalReviewDays?.toString() ?? "");
        setAuditDays(p.override.auditDays?.toString() ?? "");
        setLocationDays(p.override.locationDays?.toString() ?? "");
        setNotificationDays(p.override.notificationDays?.toString() ?? "");
        setEnabled(
          p.override.cleanupEnabled == null
            ? platform
              ? "disabled"
              : "inherit"
            : p.override.cleanupEnabled
              ? "enabled"
              : "disabled",
        );
        setHold(p.override.legalHold);
        setCandidates(reviews ? unwrapResponse<Review[]>(reviews.data) : []);
        setError(null);
      })
      .catch((e) => {
        if (active)
          setError(
            getApiErrorMessage(e, "Privacy settings could not be loaded."),
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [base, platform, revision]);
  function prepare() {
    if (
      [reviewDays, auditDays, notificationDays, locationDays].some(
        (s) =>
          s !== "" && (!/^\d+$/.test(s) || Number(s) < 1 || Number(s) > 36500),
      )
    ) {
      setError(
        "Enter approved durations from 1 to 36500 days, or leave blank.",
      );
      return;
    }
    setConfirm(true);
  }
  async function save() {
    setBusy(true);
    try {
      await apiClient.put(base, {
        operationalReviewDays: reviewDays ? Number(reviewDays) : null,
        auditDays: auditDays ? Number(auditDays) : null,
        notificationDays: notificationDays ? Number(notificationDays) : null,
        locationDays: locationDays ? Number(locationDays) : null,
        cleanupEnabled: enabled === "inherit" ? null : enabled === "enabled",
        legalHold: hold,
      });
      setConfirm(false);
      setNotice("Privacy retention policy saved.");
      setRevision((n) => n + 1);
    } catch (e) {
      setError(getApiErrorMessage(e, "The policy could not be saved."));
      setConfirm(false);
    } finally {
      setBusy(false);
    }
  }
  async function retain() {
    if (!review) return;
    setBusy(true);
    try {
      await apiClient.post(base + "/reviews", { ...review, reason });
      setReview(null);
      setNotice("Retention review recorded.");
      setRevision((n) => n + 1);
    } catch (e) {
      setError(getApiErrorMessage(e, "The review could not be recorded."));
    } finally {
      setBusy(false);
    }
  }
  const pendingAudit = auditDays
    ? Number(auditDays)
    : platform
      ? null
      : (data?.platform.auditDays ?? null);
  const pendingNotifications = notificationDays
    ? Number(notificationDays)
    : platform
      ? null
      : (data?.platform.notificationDays ?? null);
  const pendingCleanup =
    enabled === "inherit"
      ? !!data?.platform.cleanupEnabled
      : enabled === "enabled";
  const pendingHold = hold || (!platform && !!data?.platform.legalHold);
  const days = (n: number | null) =>
    n == null ? "Not configured" : `${n} days`;
  return (
    <Stack spacing={3}>
      <SectionHeader
        title="Privacy & Retention"
        description={
          platform
            ? "Set platform defaults for retention cleanup, record review and legal holds."
            : "Manage company retention overrides and review records due for a retention decision."
        }
      >
        <Button
          disabled={busy || loading}
          onClick={() => setRevision((n) => n + 1)}
        >
          Refresh
        </Button>
      </SectionHeader>
      {error ? <Alert severity="error">{error}</Alert> : null}
      {notice ? (
        <Alert severity="success" onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      ) : null}
      {loading ? (
        <Typography role="status">Loading privacy settings…</Typography>
      ) : data ? (
        <>
          <PageCard>
            <Stack spacing={2}>
              <Typography variant="h5">Effective policy</Typography>
              <Typography>
                GPS trail: {days(data.effective.locationDays ?? 30)} · Rider/trip review: {days(data.effective.operationalReviewDays)} · Audit logs:{" "}
                {days(data.effective.auditDays)} · Notifications:{" "}
                {days(data.effective.notificationDays)}
              </Typography>
              <Alert severity={data.effective.legalHold ? "warning" : "info"}>
                {data.effective.legalHold
                  ? "Legal hold is active. Automated cleanup is blocked. A platform legal hold cannot be overridden by a tenant."
                  : data.effective.cleanupEnabled
                    ? "Approved audit/notification cleanup is enabled. Pending deliveries are retained."
                    : "Audit/notification cleanup is disabled. Raw GPS trail cleanup remains active unless on legal hold."}
              </Alert>
              <Alert severity="info">Raw GPS trails expire after the configured duration (30 days by default). Samples linked to delivery evidence are retained with that evidence.</Alert>
              <Typography variant="body2">
                Rider and trip records are reviewed for care, legal and
                financial recordkeeping needs. They are not automatically
                deleted. Review decisions are audited; records become due again
                after the configured interval.
              </Typography>
            </Stack>
          </PageCard>
          <PageCard>
            <Stack
              component="form"
              spacing={2}
              onSubmit={(e) => {
                e.preventDefault();
                prepare();
              }}
            >
              <Typography variant="h5">
                {platform ? "Platform defaults" : "Company overrides"}
              </Typography>
              <Alert severity="info">
                Set only durations approved for your operating and payer
                obligations. Audit and notification cleanup permanently removes
                expired records. No retention duration is assumed by default.
              </Alert>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "repeat(3,1fr)" },
                  gap: 2,
                }}
              >
                {[
                  [
                    reviewDays,
                    setReviewDays,
                    "Rider/trip review interval (days)",
                  ],
                  [auditDays, setAuditDays, "Audit log retention (days)"],
                  [locationDays, setLocationDays, "GPS trail retention (days; default 30)"],
                  [
                    notificationDays,
                    setNotificationDays,
                    "Notification retention (days)",
                  ],
                ].map(([value, set, label]) => (
                  <TextField
                    key={label as string}
                    label={label as string}
                    value={value}
                    onChange={(e) =>
                      (set as (v: string) => void)(e.target.value)
                    }
                    disabled={busy}
                    inputProps={{ inputMode: "numeric" }}
                    helperText={
                      platform
                        ? "Blank means not configured."
                        : "Blank inherits the platform duration."
                    }
                  />
                ))}
              </Box>
              <TextField
                select
                label="Automated audit/notification cleanup"
                value={enabled}
                onChange={(e) => setEnabled(e.target.value)}
                disabled={busy}
              >
                {!platform ? (
                  <MenuItem value="inherit">Inherit platform setting</MenuItem>
                ) : null}
                <MenuItem value="disabled">Disabled</MenuItem>
                <MenuItem value="enabled">Enabled</MenuItem>
              </TextField>
              <FormControlLabel
                label={
                  platform
                    ? "Place all companies under legal hold"
                    : "Place this company under legal hold"
                }
                control={
                  <Checkbox
                    checked={hold}
                    onChange={(e) => setHold(e.target.checked)}
                    disabled={busy}
                  />
                }
              />
              <Button
                type="submit"
                variant="contained"
                disabled={busy}
                sx={{ alignSelf: "flex-start" }}
              >
                Save retention policy
              </Button>
            </Stack>
          </PageCard>
          {!platform ? (
            <PageCard>
              <Stack spacing={2}>
                <Typography variant="h5">
                  Records due for retention review
                </Typography>
                <Typography variant="body2">
                  Oldest 100 inactive rider and finished trip records due under
                  this policy. Review the record and confirm the reason it must
                  be retained.
                </Typography>
                {!candidates.length ? (
                  <Typography>No records currently require review.</Typography>
                ) : (
                  <Box sx={{ overflowX: "auto" }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Record</TableCell>
                          <TableCell>Last activity</TableCell>
                          <TableCell>Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {candidates.map((c) => (
                          <TableRow key={`${c.entityType}-${c.entityId}`}>
                            <TableCell>
                              <Button
                                component={RouterLink}
                                to={`/company/${c.entityType === "RIDER" ? "riders" : "rides"}/${c.entityId}`}
                              >
                                {c.entityType} #{c.entityId}
                              </Button>
                            </TableCell>
                            <TableCell>
                              {formatDateTime(c.lastActivity)}
                            </TableCell>
                            <TableCell>
                              <Button
                                onClick={() => {
                                  setReview(c);
                                  setReason("LEGAL_RECORDKEEPING");
                                }}
                              >
                                Record review
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                )}
              </Stack>
            </PageCard>
          ) : null}
        </>
      ) : null}
      <ConfirmDialog
        open={confirm}
        title="Apply retention policy"
        description={`Scope: ${platform ? "platform defaults" : "this company"}. Effective audit retention: ${days(pendingAudit)}. Effective notification retention: ${days(pendingNotifications)}. Cleanup: ${pendingCleanup ? "enabled" : "disabled"}. Legal hold: ${pendingHold ? "active — cleanup blocked" : "inactive"}. ${enabled === "inherit" ? "This company will follow future platform cleanup changes. " : ""}Enabled cleanup permanently deletes expired audit/notification records. Rider and trip records remain subject to review.`}
        confirmLabel="Apply policy"
        loading={busy}
        onCancel={() => setConfirm(false)}
        onConfirm={() => void save()}
      />
      <ConfirmDialog
        open={!!review}
        title="Record retention review"
        description={`Confirm the reason for retaining ${review?.entityType} #${review?.entityId}. This does not delete or anonymize the record.`}
        confirmLabel="Record review"
        loading={busy}
        onCancel={() => setReview(null)}
        onConfirm={() => void retain()}
      >
        <TextField
          select
          fullWidth
          label="Retention reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={busy}
        >
          {[
            "LEGAL_RECORDKEEPING",
            "FINANCIAL_RECONCILIATION",
            "ONGOING_CARE",
            "LEGAL_HOLD",
          ].map((r) => (
            <MenuItem key={r} value={r}>
              {r.replaceAll("_", " ").toLowerCase()}
            </MenuItem>
          ))}
        </TextField>
      </ConfirmDialog>
    </Stack>
  );
}
