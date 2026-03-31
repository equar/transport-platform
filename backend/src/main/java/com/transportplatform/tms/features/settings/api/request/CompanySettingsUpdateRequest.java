package com.transportplatform.tms.features.settings.api.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record CompanySettingsUpdateRequest(
        @NotBlank(message = "Company name is required.") @Size(max = 150, message = "Company name must be 150 characters or fewer.") String companyName,
        @NotBlank(message = "Legal name is required.") @Size(max = 150, message = "Legal name must be 150 characters or fewer.") String legalName,
        @NotBlank(message = "Business type is required.") @Size(max = 100, message = "Business type must be 100 characters or fewer.") String businessType,
        @NotBlank(message = "Support email is required.") @Email(message = "Support email must be valid.") @Size(max = 150, message = "Support email must be 150 characters or fewer.") String supportEmail,
        @NotBlank(message = "Support phone is required.") @Size(max = 50, message = "Support phone must be 50 characters or fewer.") String supportPhone,
        @NotBlank(message = "Address line 1 is required.") @Size(max = 200, message = "Address line 1 must be 200 characters or fewer.") String addressLine1,
        @Size(max = 200, message = "Address line 2 must be 200 characters or fewer.") String addressLine2,
        @NotBlank(message = "City is required.") @Size(max = 100, message = "City must be 100 characters or fewer.") String city,
        @NotBlank(message = "State is required.") @Size(max = 100, message = "State must be 100 characters or fewer.") String state,
        @NotBlank(message = "ZIP code is required.") @Size(max = 30, message = "ZIP code must be 30 characters or fewer.") String zipCode,
        @NotBlank(message = "Country is required.") @Size(max = 100, message = "Country must be 100 characters or fewer.") String country,
        @NotBlank(message = "Timezone is required.") @Size(max = 80, message = "Timezone must be 80 characters or fewer.") String timezone,
        @NotBlank(message = "Currency is required.") @Size(min = 3, max = 3, message = "Currency must be a 3-letter ISO code.") String currency,
        @NotBlank(message = "Date format is required.") @Size(max = 30, message = "Date format must be 30 characters or fewer.") String dateFormat,
        @NotNull(message = "Default ride lead time is required.") @Min(value = 0, message = "Default ride lead time must be zero or greater.") @Max(value = 1440, message = "Default ride lead time must be 1440 minutes or fewer.") Integer defaultRideLeadTimeMinutes,
        @NotNull(message = "Allow manual ride creation flag is required.") Boolean allowManualRideCreation,
        @NotNull(message = "Allow round trip rides flag is required.") Boolean allowRoundTripRides,
        @NotNull(message = "Dispatch strict compliance mode flag is required.") Boolean dispatchStrictComplianceMode,
        @NotNull(message = "Default invoice due days is required.") @Min(value = 0, message = "Default invoice due days must be zero or greater.") @Max(value = 365, message = "Default invoice due days must be 365 or fewer.") Integer defaultInvoiceDueDays,
        @Size(max = 500, message = "Default notification preferences summary must be 500 characters or fewer.") String defaultNotificationPreferencesSummary,
        @NotNull(message = "Require driver license flag is required.") Boolean requireDriverLicense,
        @NotNull(message = "Require background check flag is required.") Boolean requireBackgroundCheck,
        @NotNull(message = "Require drug test flag is required.") Boolean requireDrugTest,
        @NotNull(message = "Require vehicle registration flag is required.") Boolean requireVehicleRegistration,
        @NotNull(message = "Require vehicle insurance flag is required.") Boolean requireVehicleInsurance,
        @NotNull(message = "Require vehicle inspection flag is required.") Boolean requireVehicleInspection,
        @NotNull(message = "Expiring soon threshold is required.") @Min(value = 1, message = "Expiring soon threshold must be at least 1 day.") @Max(value = 365, message = "Expiring soon threshold must be 365 days or fewer.") Integer expiringSoonThresholdDays,
        @NotBlank(message = "Invoice prefix is required.") @Size(max = 20, message = "Invoice prefix must be 20 characters or fewer.") String invoicePrefix,
        @NotBlank(message = "Payment prefix is required.") @Size(max = 20, message = "Payment prefix must be 20 characters or fewer.") String paymentPrefix,
        @NotBlank(message = "Pricing rule prefix is required.") @Size(max = 20, message = "Pricing rule prefix must be 20 characters or fewer.") String pricingRulePrefix,
        @NotNull(message = "Tax enabled flag is required.") Boolean taxEnabled,
        @NotNull(message = "Default tax rate is required.") @DecimalMin(value = "0.00", message = "Default tax rate must be zero or greater.") @DecimalMax(value = "100.00", message = "Default tax rate must be 100 or fewer.") BigDecimal defaultTaxRate,
        @NotNull(message = "Allow manual invoice overrides flag is required.") Boolean allowManualInvoiceOverrides,
        @Size(max = 150, message = "Display name must be 150 characters or fewer.") String displayName,
        @Size(max = 500, message = "Company logo URL must be 500 characters or fewer.") String companyLogoUrl,
        @Size(max = 500, message = "Favicon URL must be 500 characters or fewer.") String faviconUrl,
        @Size(max = 500, message = "Website must be 500 characters or fewer.") String website,
        @Size(max = 500, message = "Custom login welcome text must be 500 characters or fewer.") String customLoginWelcomeText,
        @Size(max = 500, message = "Custom footer text must be 500 characters or fewer.") String customFooterText,
        @Pattern(regexp = "^$|^#[0-9A-Fa-f]{6}$", message = "Primary color must be a 6-digit hex value such as #0055AA.") String primaryColor,
        @Pattern(regexp = "^$|^#[0-9A-Fa-f]{6}$", message = "Secondary color must be a 6-digit hex value such as #0055AA.") String secondaryColor,
        @Pattern(regexp = "^$|^#[0-9A-Fa-f]{6}$", message = "Accent color must be a 6-digit hex value such as #0055AA.") String accentColor) {
}