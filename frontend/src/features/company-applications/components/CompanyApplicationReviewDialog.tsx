import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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

  useEffect(() => {
    if (!open || !application) {
      return;
    }
    setReviewNotes(application.reviewNotes ?? "");
    setRejectionReason(application.rejectionReason ?? "");
    setSubscriptionPlan("STARTER");
    setTenantCode("");
    setOwnerEmail(application.email);
  }, [application, open]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({
      reviewNotes,
      rejectionReason,
      subscriptionPlan,
      tenantCode,
      ownerEmail,
    });
  }

  const title =
    mode === "approve"
      ? "Approve Application"
      : mode === "reject"
        ? "Reject Application"
        : "Review Application";

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
              ? "Approve this company application and create the onboarding tenant and owner account hook."
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
                label="Tenant Code Override"
                value={tenantCode}
                onChange={(event) => setTenantCode(event.target.value)}
                helperText="Leave blank to auto-generate from the company name."
              />
              <TextField
                label="Subscription Plan"
                value={subscriptionPlan}
                onChange={(event) => setSubscriptionPlan(event.target.value)}
                required
              />
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
