package com.transportplatform.tms.features.settings.domain;

import com.transportplatform.tms.common.audit.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "tenant_settings")
public class TenantSettings extends AuditableEntity {

    @Id
    @Column(name = "tenant_id", nullable = false, length = 36)
    private String tenantId;

    @Column(name = "timezone", nullable = false, length = 80)
    private String timezone;

    @Column(name = "currency", nullable = false, length = 3)
    private String currency;

    @Column(name = "date_format", nullable = false, length = 30)
    private String dateFormat;

    @Column(name = "default_ride_lead_time_minutes", nullable = false)
    private int defaultRideLeadTimeMinutes;

    @Column(name = "allow_manual_ride_creation", nullable = false)
    private boolean allowManualRideCreation;

    @Column(name = "allow_round_trip_rides", nullable = false)
    private boolean allowRoundTripRides;

    @Column(name = "dispatch_strict_compliance_mode", nullable = false)
    private boolean dispatchStrictComplianceMode;

    @Column(name = "default_invoice_due_days", nullable = false)
    private int defaultInvoiceDueDays;

    @Column(name = "default_notification_preferences_summary", length = 500)
    private String defaultNotificationPreferencesSummary;

    @Column(name = "require_driver_license", nullable = false)
    private boolean requireDriverLicense;

    @Column(name = "require_background_check", nullable = false)
    private boolean requireBackgroundCheck;

    @Column(name = "require_drug_test", nullable = false)
    private boolean requireDrugTest;

    @Column(name = "require_vehicle_registration", nullable = false)
    private boolean requireVehicleRegistration;

    @Column(name = "require_vehicle_insurance", nullable = false)
    private boolean requireVehicleInsurance;

    @Column(name = "require_vehicle_inspection", nullable = false)
    private boolean requireVehicleInspection;

    @Column(name = "expiring_soon_threshold_days", nullable = false)
    private int expiringSoonThresholdDays;

    @Column(name = "invoice_prefix", nullable = false, length = 20)
    private String invoicePrefix;

    @Column(name = "payment_prefix", nullable = false, length = 20)
    private String paymentPrefix;

    @Column(name = "pricing_rule_prefix", nullable = false, length = 20)
    private String pricingRulePrefix;

    @Column(name = "tax_enabled", nullable = false)
    private boolean taxEnabled;

    @Column(name = "default_tax_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal defaultTaxRate;

    @Column(name = "allow_manual_invoice_overrides", nullable = false)
    private boolean allowManualInvoiceOverrides;

    @Column(name = "company_logo_url", length = 500)
    private String companyLogoUrl;

    @Column(name = "primary_color", length = 20)
    private String primaryColor;

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getDateFormat() {
        return dateFormat;
    }

    public void setDateFormat(String dateFormat) {
        this.dateFormat = dateFormat;
    }

    public int getDefaultRideLeadTimeMinutes() {
        return defaultRideLeadTimeMinutes;
    }

    public void setDefaultRideLeadTimeMinutes(int defaultRideLeadTimeMinutes) {
        this.defaultRideLeadTimeMinutes = defaultRideLeadTimeMinutes;
    }

    public boolean isAllowManualRideCreation() {
        return allowManualRideCreation;
    }

    public void setAllowManualRideCreation(boolean allowManualRideCreation) {
        this.allowManualRideCreation = allowManualRideCreation;
    }

    public boolean isAllowRoundTripRides() {
        return allowRoundTripRides;
    }

    public void setAllowRoundTripRides(boolean allowRoundTripRides) {
        this.allowRoundTripRides = allowRoundTripRides;
    }

    public boolean isDispatchStrictComplianceMode() {
        return dispatchStrictComplianceMode;
    }

    public void setDispatchStrictComplianceMode(boolean dispatchStrictComplianceMode) {
        this.dispatchStrictComplianceMode = dispatchStrictComplianceMode;
    }

    public int getDefaultInvoiceDueDays() {
        return defaultInvoiceDueDays;
    }

    public void setDefaultInvoiceDueDays(int defaultInvoiceDueDays) {
        this.defaultInvoiceDueDays = defaultInvoiceDueDays;
    }

    public String getDefaultNotificationPreferencesSummary() {
        return defaultNotificationPreferencesSummary;
    }

    public void setDefaultNotificationPreferencesSummary(String defaultNotificationPreferencesSummary) {
        this.defaultNotificationPreferencesSummary = defaultNotificationPreferencesSummary;
    }

    public boolean isRequireDriverLicense() {
        return requireDriverLicense;
    }

    public void setRequireDriverLicense(boolean requireDriverLicense) {
        this.requireDriverLicense = requireDriverLicense;
    }

    public boolean isRequireBackgroundCheck() {
        return requireBackgroundCheck;
    }

    public void setRequireBackgroundCheck(boolean requireBackgroundCheck) {
        this.requireBackgroundCheck = requireBackgroundCheck;
    }

    public boolean isRequireDrugTest() {
        return requireDrugTest;
    }

    public void setRequireDrugTest(boolean requireDrugTest) {
        this.requireDrugTest = requireDrugTest;
    }

    public boolean isRequireVehicleRegistration() {
        return requireVehicleRegistration;
    }

    public void setRequireVehicleRegistration(boolean requireVehicleRegistration) {
        this.requireVehicleRegistration = requireVehicleRegistration;
    }

    public boolean isRequireVehicleInsurance() {
        return requireVehicleInsurance;
    }

    public void setRequireVehicleInsurance(boolean requireVehicleInsurance) {
        this.requireVehicleInsurance = requireVehicleInsurance;
    }

    public boolean isRequireVehicleInspection() {
        return requireVehicleInspection;
    }

    public void setRequireVehicleInspection(boolean requireVehicleInspection) {
        this.requireVehicleInspection = requireVehicleInspection;
    }

    public int getExpiringSoonThresholdDays() {
        return expiringSoonThresholdDays;
    }

    public void setExpiringSoonThresholdDays(int expiringSoonThresholdDays) {
        this.expiringSoonThresholdDays = expiringSoonThresholdDays;
    }

    public String getInvoicePrefix() {
        return invoicePrefix;
    }

    public void setInvoicePrefix(String invoicePrefix) {
        this.invoicePrefix = invoicePrefix;
    }

    public String getPaymentPrefix() {
        return paymentPrefix;
    }

    public void setPaymentPrefix(String paymentPrefix) {
        this.paymentPrefix = paymentPrefix;
    }

    public String getPricingRulePrefix() {
        return pricingRulePrefix;
    }

    public void setPricingRulePrefix(String pricingRulePrefix) {
        this.pricingRulePrefix = pricingRulePrefix;
    }

    public boolean isTaxEnabled() {
        return taxEnabled;
    }

    public void setTaxEnabled(boolean taxEnabled) {
        this.taxEnabled = taxEnabled;
    }

    public BigDecimal getDefaultTaxRate() {
        return defaultTaxRate;
    }

    public void setDefaultTaxRate(BigDecimal defaultTaxRate) {
        this.defaultTaxRate = defaultTaxRate;
    }

    public boolean isAllowManualInvoiceOverrides() {
        return allowManualInvoiceOverrides;
    }

    public void setAllowManualInvoiceOverrides(boolean allowManualInvoiceOverrides) {
        this.allowManualInvoiceOverrides = allowManualInvoiceOverrides;
    }

    public String getCompanyLogoUrl() {
        return companyLogoUrl;
    }

    public void setCompanyLogoUrl(String companyLogoUrl) {
        this.companyLogoUrl = companyLogoUrl;
    }

    public String getPrimaryColor() {
        return primaryColor;
    }

    public void setPrimaryColor(String primaryColor) {
        this.primaryColor = primaryColor;
    }
}