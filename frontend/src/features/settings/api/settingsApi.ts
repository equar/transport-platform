import { apiClient, unwrapResponse } from "../../../shared/api/client";

export interface CompanySettingsRecord {
  tenantId: string;
  companyName: string;
  legalName: string;
  businessType: string;
  supportEmail: string;
  supportPhone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  defaultRideLeadTimeMinutes: number;
  allowManualRideCreation: boolean;
  allowRoundTripRides: boolean;
  dispatchStrictComplianceMode: boolean;
  defaultInvoiceDueDays: number;
  defaultNotificationPreferencesSummary: string | null;
  requireDriverLicense: boolean;
  requireBackgroundCheck: boolean;
  requireDrugTest: boolean;
  requireVehicleRegistration: boolean;
  requireVehicleInsurance: boolean;
  requireVehicleInspection: boolean;
  expiringSoonThresholdDays: number;
  invoicePrefix: string;
  paymentPrefix: string;
  pricingRulePrefix: string;
  taxEnabled: boolean;
  defaultTaxRate: number;
  allowManualInvoiceOverrides: boolean;
  displayName: string | null;
  companyLogoUrl: string | null;
  faviconUrl: string | null;
  website: string | null;
  customLoginWelcomeText: string | null;
  customFooterText: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  profileCompletenessPercent: number;
  createdBy: string | null;
  createdAt: string | null;
  updatedBy: string | null;
  updatedAt: string | null;
}

export interface CompanySettingsPayload {
  companyName: string;
  legalName: string;
  businessType: string;
  supportEmail: string;
  supportPhone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  defaultRideLeadTimeMinutes: number;
  allowManualRideCreation: boolean;
  allowRoundTripRides: boolean;
  dispatchStrictComplianceMode: boolean;
  defaultInvoiceDueDays: number;
  defaultNotificationPreferencesSummary?: string | null;
  requireDriverLicense: boolean;
  requireBackgroundCheck: boolean;
  requireDrugTest: boolean;
  requireVehicleRegistration: boolean;
  requireVehicleInsurance: boolean;
  requireVehicleInspection: boolean;
  expiringSoonThresholdDays: number;
  invoicePrefix: string;
  paymentPrefix: string;
  pricingRulePrefix: string;
  taxEnabled: boolean;
  defaultTaxRate: number;
  allowManualInvoiceOverrides: boolean;
  displayName?: string | null;
  companyLogoUrl?: string | null;
  faviconUrl?: string | null;
  website?: string | null;
  customLoginWelcomeText?: string | null;
  customFooterText?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
}

function cleanText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function cleanPayload(payload: CompanySettingsPayload) {
  return {
    ...payload,
    companyName: payload.companyName.trim(),
    legalName: payload.legalName.trim(),
    businessType: payload.businessType.trim(),
    supportEmail: payload.supportEmail.trim(),
    supportPhone: payload.supportPhone.trim(),
    addressLine1: payload.addressLine1.trim(),
    addressLine2: cleanText(payload.addressLine2),
    city: payload.city.trim(),
    state: payload.state.trim(),
    zipCode: payload.zipCode.trim(),
    country: payload.country.trim(),
    timezone: payload.timezone.trim(),
    currency: payload.currency.trim().toUpperCase(),
    dateFormat: payload.dateFormat.trim(),
    defaultNotificationPreferencesSummary: cleanText(
      payload.defaultNotificationPreferencesSummary,
    ),
    invoicePrefix: payload.invoicePrefix.trim().toUpperCase(),
    paymentPrefix: payload.paymentPrefix.trim().toUpperCase(),
    pricingRulePrefix: payload.pricingRulePrefix.trim().toUpperCase(),
    displayName: cleanText(payload.displayName),
    companyLogoUrl: cleanText(payload.companyLogoUrl),
    faviconUrl: cleanText(payload.faviconUrl),
    website: cleanText(payload.website),
    customLoginWelcomeText: cleanText(payload.customLoginWelcomeText),
    customFooterText: cleanText(payload.customFooterText),
    primaryColor: cleanText(payload.primaryColor),
    secondaryColor: cleanText(payload.secondaryColor),
    accentColor: cleanText(payload.accentColor),
  };
}

export const settingsApi = {
  async getCompanySettings() {
    const response = await apiClient.get("/company/settings");
    return unwrapResponse<CompanySettingsRecord>(response.data);
  },
  async updateCompanySettings(payload: CompanySettingsPayload) {
    const response = await apiClient.put(
      "/company/settings",
      cleanPayload(payload),
    );
    return unwrapResponse<CompanySettingsRecord>(response.data);
  },
};