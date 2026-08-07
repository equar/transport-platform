import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import type {
  CompanyApplication,
  CompanyApplicationReviewPayload,
} from "../api/companyApplicationsApi";

interface CompanyApplicationReviewDialogProps {
  open: boolean;
  mode: "under-review" | "approve" | "reject";
  application: CompanyApplication | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (payload: CompanyApplicationReviewPayload) => Promise<void>;
}

export function CompanyApplicationReviewDialog({
  open,
  mode,
  application,
  loading = false,
  onClose,
  onSubmit,
}: CompanyApplicationReviewDialogProps) {
  const [reviewNotes, setReviewNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [subscriptionPlan, setSubscriptionPlan] = useState("STARTER");
  const [tenantCode, setTenantCode] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");

  useEffect(() => {
    if (!open || !application) {
      return;
    }
    setReviewNotes(application.reviewNotes ?? "");
    setRejectionReason(application.rejectionReason ?? "");
    setSubscriptionPlan("STARTER");
    setTenantCode("");
    setOwnerEmail(application.email);
    setOwnerPassword("");
  }, [application, open]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({
      reviewNotes,
      rejectionReason,
      subscriptionPlan,
      tenantCode,
      ownerEmail,
      ...(mode === "approve" ? { ownerPassword } : {}),
    });
  }

  const title =
    mode === "approve"
      ? "Approve Application"
      : mode === "reject"
        ? "Reject Application"
        : "Review Application";
  const subscriptionPlans = ["STARTER", "GROWTH", "ENTERPRISE"];

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack
          component="form"
          spacing={2}
          sx={{ mt: 1 }}
          onSubmit={handleSubmit}
        >
          <Typography color="text.secondary">
            {mode === "approve"
              ? "Approve this application and provision a pending tenant workspace with its owner account. Activate the tenant after verifying onboarding readiness."
              : mode === "reject"
                ? "Reject this application with a clear reason for the applicant and audit trail."
                : "Move this application into the review queue and capture initial review notes."}
          </Typography>
          <TextField
            label="Review Notes"
            multiline
            minRows={3}
            value={reviewNotes}
            onChange={(event) => setReviewNotes(event.target.value)}
          />
          {mode === "approve" ? (
            <>
              <TextField
                label="Owner Email"
                type="email"
                value={ownerEmail}
                onChange={(event) => setOwnerEmail(event.target.value)}
                required
              />
              <TextField
                label="Temporary Owner Password"
                type="password"
                value={ownerPassword}
                onChange={(event) => setOwnerPassword(event.target.value)}
                required
                inputProps={{ minLength: 8, maxLength: 100 }}
                helperText="Share this temporary password securely with the tenant owner. They can change it after signing in."
              />
              <TextField
                label="Tenant Code Override"
                value={tenantCode}
                onChange={(event) => setTenantCode(event.target.value)}
                helperText="Leave blank to auto-generate from the company name."
              />
              <TextField
                label="Subscription Plan"
                select
                value={subscriptionPlan}
                onChange={(event) => setSubscriptionPlan(event.target.value)}
                required
              >
                {subscriptionPlans.map((plan) => <MenuItem key={plan} value={plan}>{plan}</MenuItem>)}
              </TextField>
            </>
          ) : null}
          {mode === "reject" ? (
            <TextField
              label="Rejection Reason"
              multiline
              minRows={3}
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              required
            />
          ) : (
            <input type="hidden" value={rejectionReason} readOnly />
          )}
          {mode !== "approve" ? (
            <input type="hidden" value={ownerEmail} readOnly />
          ) : null}
          <DialogActions sx={{ px: 0, pb: 0 }}>
            <Button onClick={onClose} color="inherit" disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading
                ? "Working..."
                : mode === "approve"
                  ? "Approve Application"
                  : mode === "reject"
                    ? "Reject Application"
                    : "Move to Review"}
            </Button>
          </DialogActions>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
