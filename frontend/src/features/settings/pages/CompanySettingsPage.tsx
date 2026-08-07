import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import RuleRoundedIcon from "@mui/icons-material/RuleRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import {
  Alert,
  Button,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { LoadingState } from "../../../shared/components/LoadingState";
import { MetricCard } from "../../../shared/components/MetricCard";
import { PageCard } from "../../../shared/components/PageCard";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { useRuntimeCapabilities } from "../../runtime/context/RuntimeCapabilitiesContext";
import { useToast } from "../../../shared/providers/ToastProvider";
import { formatDateTime } from "../../../shared/utils/format";
import { PasswordChangeCard } from "../../auth/components/PasswordChangeCard";
import {
  settingsApi,
  type CompanySettingsPayload,
  type CompanySettingsRecord,
} from "../api/settingsApi";

function toPayload(settings: CompanySettingsRecord): CompanySettingsPayload {
  return {
    companyName: settings.companyName,
    legalName: settings.legalName,
    businessType: settings.businessType,
    supportEmail: settings.supportEmail,
    supportPhone: settings.supportPhone,
    addressLine1: settings.addressLine1,
    addressLine2: settings.addressLine2,
    city: settings.city,
    state: settings.state,
    zipCode: settings.zipCode,
    country: settings.country,
    timezone: settings.timezone,
    currency: settings.currency,
    dateFormat: settings.dateFormat,
    defaultRideLeadTimeMinutes: settings.defaultRideLeadTimeMinutes,
    allowManualRideCreation: settings.allowManualRideCreation,
    allowRoundTripRides: settings.allowRoundTripRides,
    dispatchStrictComplianceMode: settings.dispatchStrictComplianceMode,
    defaultInvoiceDueDays: settings.defaultInvoiceDueDays,
    defaultNotificationPreferencesSummary:
      settings.defaultNotificationPreferencesSummary,
    requireDriverLicense: settings.requireDriverLicense,
    requireBackgroundCheck: settings.requireBackgroundCheck,
    requireDrugTest: settings.requireDrugTest,
    requireVehicleRegistration: settings.requireVehicleRegistration,
    requireVehicleInsurance: settings.requireVehicleInsurance,
    requireVehicleInspection: settings.requireVehicleInspection,
    expiringSoonThresholdDays: settings.expiringSoonThresholdDays,
    invoicePrefix: settings.invoicePrefix,
    paymentPrefix: settings.paymentPrefix,
    pricingRulePrefix: settings.pricingRulePrefix,
    taxEnabled: settings.taxEnabled,
    defaultTaxRate: settings.defaultTaxRate,
    allowManualInvoiceOverrides: settings.allowManualInvoiceOverrides,
    displayName: settings.displayName,
    companyLogoUrl: settings.companyLogoUrl,
    faviconUrl: settings.faviconUrl,
    website: settings.website,
    customLoginWelcomeText: settings.customLoginWelcomeText,
    customFooterText: settings.customFooterText,
    primaryColor: settings.primaryColor,
    secondaryColor: settings.secondaryColor,
    accentColor: settings.accentColor,
  };
}

function emptySettings(): CompanySettingsRecord {
  return {
    tenantId: "",
    companyName: "",
    legalName: "",
    businessType: "",
    supportEmail: "",
    supportPhone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    timezone: "America/New_York",
    currency: "USD",
    dateFormat: "MM/dd/yyyy",
    defaultRideLeadTimeMinutes: 60,
    allowManualRideCreation: true,
    allowRoundTripRides: true,
    dispatchStrictComplianceMode: false,
    defaultInvoiceDueDays: 30,
    defaultNotificationPreferencesSummary: "",
    requireDriverLicense: true,
    requireBackgroundCheck: true,
    requireDrugTest: true,
    requireVehicleRegistration: true,
    requireVehicleInsurance: true,
    requireVehicleInspection: true,
    expiringSoonThresholdDays: 30,
    invoicePrefix: "INV",
    paymentPrefix: "PAY",
    pricingRulePrefix: "PRC",
    taxEnabled: false,
    defaultTaxRate: 0,
    allowManualInvoiceOverrides: false,
    displayName: "",
    companyLogoUrl: "",
    faviconUrl: "",
    website: "",
    customLoginWelcomeText: "",
    customFooterText: "",
    primaryColor: "#0055AA",
    secondaryColor: "#16324F",
    accentColor: "#14B8A6",
    profileCompletenessPercent: 0,
    createdBy: null,
    createdAt: null,
    updatedBy: null,
    updatedAt: null,
  };
}

export function CompanySettingsPage() {
  const { showError, showSuccess } = useToast();
  const { reloadCapabilities } = useRuntimeCapabilities();
  const [settings, setSettings] =
    useState<CompanySettingsRecord>(emptySettings());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadSettings() {
    setLoading(true);
    try {
      const response = await settingsApi.getCompanySettings();
      setSettings(response);
      setError(null);
    } catch {
      setError("Company settings could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSettings();
  }, []);

  function setValue<K extends keyof CompanySettingsRecord>(
    key: K,
    value: CompanySettingsRecord[K],
  ) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const response = await settingsApi.updateCompanySettings(
        toPayload(settings),
      );
      setSettings(response);
      await reloadCapabilities();
      showSuccess("Company settings updated successfully.");
    } catch {
      showError("Company settings could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Stack spacing={3}>
      <SectionHeader
        eyebrow="Workspace configuration"
        title="Company Settings"
        description="Manage tenant profile, operational defaults, compliance policy switches, billing configuration, and brand settings from one control surface."
      >
        <Button
          variant="contained"
          startIcon={<SaveRoundedIcon />}
          onClick={() => void handleSave()}
          disabled={loading || saving}
        >
          Save Settings
        </Button>
      </SectionHeader>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <MetricCard
          icon={<SettingsRoundedIcon color="primary" />}
          label="Profile Completeness"
          value={`${settings.profileCompletenessPercent}%`}
          caption="How much of the tenant profile and operational configuration is currently populated."
        />
        <MetricCard
          icon={<RuleRoundedIcon color="primary" />}
          label="Lead Time"
          value={`${settings.defaultRideLeadTimeMinutes} min`}
          caption="Default lead time applied before new rides are considered ready for execution."
        />
        <MetricCard
          icon={<PaletteRoundedIcon color="primary" />}
          label="Last Updated"
          value={formatDateTime(settings.updatedAt)}
          caption="Most recent settings update recorded for this tenant."
        />
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {loading ? (
        <LoadingState />
      ) : (
        <>
          <PageCard>
            <Stack spacing={2.5}>
              <Typography variant="h5">Company Profile</Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  label="Display Name"
                  value={settings.displayName ?? ""}
                  onChange={(event) =>
                    setValue("displayName", event.target.value)
                  }
                  fullWidth
                />
                <TextField
                  label="Company Name"
                  value={settings.companyName}
                  onChange={(event) =>
                    setValue("companyName", event.target.value)
                  }
                  fullWidth
                />
                <TextField
                  label="Legal Name"
                  value={settings.legalName}
                  onChange={(event) =>
                    setValue("legalName", event.target.value)
                  }
                  fullWidth
                />
                <TextField
                  label="Business Type"
                  value={settings.businessType}
                  onChange={(event) =>
                    setValue("businessType", event.target.value)
                  }
                  fullWidth
                />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  label="Website"
                  value={settings.website ?? ""}
                  onChange={(event) => setValue("website", event.target.value)}
                  fullWidth
                />
                <TextField
                  label="Support Email"
                  value={settings.supportEmail}
                  onChange={(event) =>
                    setValue("supportEmail", event.target.value)
                  }
                  fullWidth
                />
                <TextField
                  label="Support Phone"
                  value={settings.supportPhone}
                  onChange={(event) =>
                    setValue("supportPhone", event.target.value)
                  }
                  fullWidth
                />
                <TextField
                  label="Timezone"
                  value={settings.timezone}
                  onChange={(event) => setValue("timezone", event.target.value)}
                  fullWidth
                />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  label="Address Line 1"
                  value={settings.addressLine1}
                  onChange={(event) =>
                    setValue("addressLine1", event.target.value)
                  }
                  fullWidth
                />
                <TextField
                  label="Address Line 2"
                  value={settings.addressLine2 ?? ""}
                  onChange={(event) =>
                    setValue("addressLine2", event.target.value)
                  }
                  fullWidth
                />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  label="City"
                  value={settings.city}
                  onChange={(event) => setValue("city", event.target.value)}
                  fullWidth
                />
                <TextField
                  label="State"
                  value={settings.state}
                  onChange={(event) => setValue("state", event.target.value)}
                  fullWidth
                />
                <TextField
                  label="ZIP Code"
                  value={settings.zipCode}
                  onChange={(event) => setValue("zipCode", event.target.value)}
                  fullWidth
                />
                <TextField
                  label="Country"
                  value={settings.country}
                  onChange={(event) => setValue("country", event.target.value)}
                  fullWidth
                />
              </Stack>
            </Stack>
          </PageCard>

          <PageCard>
            <Stack spacing={2.5}>
              <Typography variant="h5">Operational Defaults</Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  label="Default Ride Lead Time Minutes"
                  type="number"
                  value={settings.defaultRideLeadTimeMinutes}
                  onChange={(event) =>
                    setValue(
                      "defaultRideLeadTimeMinutes",
                      Number(event.target.value),
                    )
                  }
                  fullWidth
                />
                <TextField
                  label="Default Invoice Due Days"
                  type="number"
                  value={settings.defaultInvoiceDueDays}
                  onChange={(event) =>
                    setValue(
                      "defaultInvoiceDueDays",
                      Number(event.target.value),
                    )
                  }
                  fullWidth
                />
                <TextField
                  label="Expiring Soon Threshold Days"
                  type="number"
                  value={settings.expiringSoonThresholdDays}
                  onChange={(event) =>
                    setValue(
                      "expiringSoonThresholdDays",
                      Number(event.target.value),
                    )
                  }
                  fullWidth
                />
              </Stack>
              <TextField
                label="Default Notification Preferences Summary"
                value={settings.defaultNotificationPreferencesSummary ?? ""}
                onChange={(event) =>
                  setValue(
                    "defaultNotificationPreferencesSummary",
                    event.target.value,
                  )
                }
                fullWidth
                multiline
                minRows={2}
              />
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                flexWrap="wrap"
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.allowManualRideCreation}
                      onChange={(event) =>
                        setValue(
                          "allowManualRideCreation",
                          event.target.checked,
                        )
                      }
                    />
                  }
                  label="Allow manual ride creation"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.allowRoundTripRides}
                      onChange={(event) =>
                        setValue("allowRoundTripRides", event.target.checked)
                      }
                    />
                  }
                  label="Allow round-trip rides"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.dispatchStrictComplianceMode}
                      onChange={(event) =>
                        setValue(
                          "dispatchStrictComplianceMode",
                          event.target.checked,
                        )
                      }
                    />
                  }
                  label="Strict compliance dispatch mode"
                />
              </Stack>
            </Stack>
          </PageCard>

          <PageCard>
            <Stack spacing={2.5}>
              <Typography variant="h5">
                Compliance And Billing Controls
              </Typography>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                flexWrap="wrap"
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.requireDriverLicense}
                      onChange={(event) =>
                        setValue("requireDriverLicense", event.target.checked)
                      }
                    />
                  }
                  label="Require driver license"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.requireBackgroundCheck}
                      onChange={(event) =>
                        setValue("requireBackgroundCheck", event.target.checked)
                      }
                    />
                  }
                  label="Require background check"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.requireDrugTest}
                      onChange={(event) =>
                        setValue("requireDrugTest", event.target.checked)
                      }
                    />
                  }
                  label="Require drug test"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.requireVehicleRegistration}
                      onChange={(event) =>
                        setValue(
                          "requireVehicleRegistration",
                          event.target.checked,
                        )
                      }
                    />
                  }
                  label="Require vehicle registration"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.requireVehicleInsurance}
                      onChange={(event) =>
                        setValue(
                          "requireVehicleInsurance",
                          event.target.checked,
                        )
                      }
                    />
                  }
                  label="Require vehicle insurance"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.requireVehicleInspection}
                      onChange={(event) =>
                        setValue(
                          "requireVehicleInspection",
                          event.target.checked,
                        )
                      }
                    />
                  }
                  label="Require vehicle inspection"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.taxEnabled}
                      onChange={(event) =>
                        setValue("taxEnabled", event.target.checked)
                      }
                    />
                  }
                  label="Enable tax"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.allowManualInvoiceOverrides}
                      onChange={(event) =>
                        setValue(
                          "allowManualInvoiceOverrides",
                          event.target.checked,
                        )
                      }
                    />
                  }
                  label="Allow manual invoice overrides"
                />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  label="Currency"
                  value={settings.currency}
                  onChange={(event) => setValue("currency", event.target.value)}
                  fullWidth
                />
                <TextField
                  label="Date Format"
                  value={settings.dateFormat}
                  onChange={(event) =>
                    setValue("dateFormat", event.target.value)
                  }
                  fullWidth
                />
                <TextField
                  label="Default Tax Rate"
                  type="number"
                  value={settings.defaultTaxRate}
                  onChange={(event) =>
                    setValue("defaultTaxRate", Number(event.target.value))
                  }
                  fullWidth
                />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  label="Invoice Prefix"
                  value={settings.invoicePrefix}
                  onChange={(event) =>
                    setValue("invoicePrefix", event.target.value)
                  }
                  fullWidth
                />
                <TextField
                  label="Payment Prefix"
                  value={settings.paymentPrefix}
                  onChange={(event) =>
                    setValue("paymentPrefix", event.target.value)
                  }
                  fullWidth
                />
                <TextField
                  label="Pricing Rule Prefix"
                  value={settings.pricingRulePrefix}
                  onChange={(event) =>
                    setValue("pricingRulePrefix", event.target.value)
                  }
                  fullWidth
                />
              </Stack>
            </Stack>
          </PageCard>

          <PageCard>
            <Stack spacing={2.5}>
              <Typography variant="h5">Branding</Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  label="Company Logo URL"
                  value={settings.companyLogoUrl ?? ""}
                  onChange={(event) =>
                    setValue("companyLogoUrl", event.target.value)
                  }
                  fullWidth
                />
                <TextField
                  label="Favicon URL"
                  value={settings.faviconUrl ?? ""}
                  onChange={(event) =>
                    setValue("faviconUrl", event.target.value)
                  }
                  fullWidth
                />
                <TextField
                  label="Primary Color"
                  value={settings.primaryColor ?? ""}
                  onChange={(event) =>
                    setValue("primaryColor", event.target.value)
                  }
                  placeholder="#0055AA"
                  fullWidth
                />
                <TextField
                  label="Secondary Color"
                  value={settings.secondaryColor ?? ""}
                  onChange={(event) =>
                    setValue("secondaryColor", event.target.value)
                  }
                  placeholder="#16324F"
                  fullWidth
                />
                <TextField
                  label="Accent Color"
                  value={settings.accentColor ?? ""}
                  onChange={(event) =>
                    setValue("accentColor", event.target.value)
                  }
                  placeholder="#14B8A6"
                  fullWidth
                />
              </Stack>
              <TextField
                label="Custom Login Welcome Text"
                value={settings.customLoginWelcomeText ?? ""}
                onChange={(event) =>
                  setValue("customLoginWelcomeText", event.target.value)
                }
                fullWidth
                multiline
                minRows={2}
              />
              <TextField
                label="Custom Footer Text"
                value={settings.customFooterText ?? ""}
                onChange={(event) =>
                  setValue("customFooterText", event.target.value)
                }
                fullWidth
                multiline
                minRows={2}
              />
            </Stack>
          </PageCard>
        </>
      )}
      <PasswordChangeCard />
    </Stack>
  );
}
