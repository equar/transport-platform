package com.transportplatform.tms.features.runtime.api.response;

public record RuntimeOperationalSettingsResponse(
        String timezone,
        String currency,
        String dateFormat,
        int defaultRideLeadTimeMinutes,
        int defaultInvoiceDueDays,
        String invoicePrefix,
        String paymentPrefix,
        String pricingRulePrefix) {
}