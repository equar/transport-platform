import { Alert, Button, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { EmptyState } from "../../../shared/components/EmptyState";
import { LoadingState } from "../../../shared/components/LoadingState";
import { PageCard } from "../../../shared/components/PageCard";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { useToast } from "../../../shared/providers/ToastProvider";
import { complianceApi, type TransportComplianceRecord } from "../api/complianceApi";

export function PlatformTransportCompliancePage() {
  const { tenantId = "" } = useParams();
  const [profile, setProfile] = useState<TransportComplianceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const { showError, showSuccess } = useToast();
  useEffect(() => { complianceApi.getTenantTransportProfile(tenantId).then(setProfile)
    .catch(() => showError("Compliance profile could not be loaded."))
    .finally(() => setLoading(false)); }, [tenantId]);
  async function decide(approved: boolean) {
    try { setProfile(await complianceApi.decideTenantTransportProfile(tenantId, approved, notes)); showSuccess(approved ? "Profile verified." : "Profile rejected."); }
    catch { showError("The compliance decision could not be saved."); }
  }
  if (loading) return <LoadingState title="Loading tenant compliance profile" />;
  if (!profile) return <Stack spacing={2}><EmptyState title="No compliance submission" description="This tenant has not submitted its transport compliance attestation." /><Button component={Link} to="/platform/tenants">Back to tenants</Button></Stack>;
  return <Stack spacing={3}>
    <SectionHeader eyebrow="Platform governance" title="Tenant Transport Compliance" description="Review operator authority, insurance, student privacy and safeguarding attestations before enabling dispatch." />
    <Alert severity={profile.verificationStatus === "VERIFIED" ? "success" : "warning"}>Status: {profile.verificationStatus.replaceAll("_", " ")}</Alert>
    <PageCard><Stack spacing={1}>
      <Typography>Scope: {profile.operatingScope.replaceAll("_", " ")}</Typography>
      <Typography>Primary state: {profile.primaryState}</Typography>
      <Typography>Authority: {profile.operatingAuthorityType || "Not specified"} — {profile.operatingAuthorityNumber || "Not specified"}</Typography>
      <Typography>Authority expiration: {profile.operatingAuthorityExpiresOn || "Not specified"}</Typography>
      <Typography>Insurance expiration: {profile.insuranceExpiresOn || "Not specified"}</Typography>
      <Typography>Student safeguarding: {profile.studentSafeguardingPolicyVerified ? "Attested" : "Missing"}</Typography>
      <Typography>FERPA agreement: {profile.ferpaDataAgreementVerified ? "Attested" : "Missing"}</Typography>
      <Typography>Employee consent: {profile.employeeTransportConsentPolicyVerified ? "Attested" : "Missing"}</Typography>
      <Typography>Accessibility policy: {profile.accessibilityPolicyVerified ? "Attested" : "Missing"}</Typography>
    </Stack></PageCard>
    {profile.verificationStatus === "PENDING_REVIEW" && <PageCard><Stack spacing={2}>
      <TextField multiline minRows={3} label="Review notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <Stack direction="row" spacing={2}><Button variant="contained" onClick={() => void decide(true)}>Verify</Button>
        <Button color="error" variant="outlined" onClick={() => void decide(false)}>Reject</Button></Stack>
    </Stack></PageCard>}
  </Stack>;
}
