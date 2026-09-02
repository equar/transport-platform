import { Alert, Button, Checkbox, FormControlLabel, MenuItem, Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { LoadingState } from "../../../shared/components/LoadingState";
import { PageCard } from "../../../shared/components/PageCard";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { useToast } from "../../../shared/providers/ToastProvider";
import { complianceApi, type TransportCompliancePayload } from "../api/complianceApi";

const emptyForm: TransportCompliancePayload = {
  operatingScope: "STUDENT_AND_WORKFORCE",
  primaryState: "NC",
  operatingAuthorityType: "",
  operatingAuthorityNumber: "",
  operatingAuthorityExpiresOn: null,
  insuranceVerified: false,
  insuranceExpiresOn: null,
  studentSafeguardingPolicyVerified: false,
  ferpaDataAgreementVerified: false,
  employeeTransportConsentPolicyVerified: false,
  accessibilityPolicyVerified: false,
};

export function TransportCompliancePage() {
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState("INCOMPLETE");
  const [notes, setNotes] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    complianceApi.getTransportProfile().then((profile) => {
      if (profile) {
        const { tenantId: _tenantId, verificationStatus, verificationNotes, ...values } = profile;
        setForm(values);
        setStatus(verificationStatus);
        setNotes(verificationNotes);
      }
    }).catch(() => showError("Transport compliance profile could not be loaded."))
      .finally(() => setLoading(false));
  }, []);

  function field<K extends keyof TransportCompliancePayload>(key: K, value: TransportCompliancePayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit() {
    setSaving(true);
    try {
      const saved = await complianceApi.attestTransportProfile(form);
      setStatus(saved.verificationStatus);
      setNotes(saved.verificationNotes);
      showSuccess("Compliance profile submitted for platform review.");
    } catch { showError("Compliance profile could not be submitted. Check all required attestations and dates."); }
    finally { setSaving(false); }
  }

  if (loading) return <LoadingState title="Loading transport compliance profile" />;

  return <Stack spacing={3}>
    <SectionHeader eyebrow="Governance" title="Transport Compliance"
      description="Attest the operator controls used for student and workforce transportation. Platform verification is required before dispatch assignments." />
    <Alert severity={status === "VERIFIED" ? "success" : status === "REJECTED" || status === "SUSPENDED" ? "error" : "warning"}>
      Verification status: {status.replaceAll("_", " ")}{notes ? ` — ${notes}` : ""}
    </Alert>
    <PageCard>
      <Stack spacing={2}>
        <TextField select label="Operating scope" value={form.operatingScope}
          onChange={(e) => field("operatingScope", e.target.value as TransportCompliancePayload["operatingScope"])}>
          <MenuItem value="STUDENT_AND_WORKFORCE">Student and workforce</MenuItem>
          <MenuItem value="STUDENT_ONLY">Student only</MenuItem>
          <MenuItem value="WORKFORCE_ONLY">Workforce only</MenuItem>
        </TextField>
        <TextField label="Primary state" value={form.primaryState} inputProps={{ maxLength: 2 }}
          onChange={(e) => field("primaryState", e.target.value.toUpperCase())} />
        <TextField label="Operating authority type" value={form.operatingAuthorityType ?? ""}
          onChange={(e) => field("operatingAuthorityType", e.target.value)} />
        <TextField label="Operating authority number" value={form.operatingAuthorityNumber ?? ""}
          onChange={(e) => field("operatingAuthorityNumber", e.target.value)} />
        <TextField type="date" label="Authority expiration" InputLabelProps={{ shrink: true }}
          value={form.operatingAuthorityExpiresOn ?? ""} onChange={(e) => field("operatingAuthorityExpiresOn", e.target.value || null)} />
        <TextField required type="date" label="Insurance expiration" InputLabelProps={{ shrink: true }}
          value={form.insuranceExpiresOn ?? ""} onChange={(e) => field("insuranceExpiresOn", e.target.value || null)} />
        {([
          ["insuranceVerified", "Current commercial transportation insurance has been verified"],
          ["studentSafeguardingPolicyVerified", "Student safeguarding and authorized-handoff policy is in force"],
          ["ferpaDataAgreementVerified", "Required school/FERPA data agreements are in force"],
          ["employeeTransportConsentPolicyVerified", "Employee transportation consent and notice policy is in force"],
          ["accessibilityPolicyVerified", "Accessibility, accommodation, and nondiscrimination policy is in force"],
        ] as const).map(([key, label]) => <FormControlLabel key={key} control={<Checkbox checked={form[key]}
          onChange={(e) => field(key, e.target.checked)} />} label={label} />)}
        <Button variant="contained" disabled={saving} onClick={() => void submit()}>
          {saving ? "Submitting…" : "Submit for verification"}
        </Button>
      </Stack>
    </PageCard>
  </Stack>;
}
