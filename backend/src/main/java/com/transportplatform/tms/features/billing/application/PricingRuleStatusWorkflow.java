package com.transportplatform.tms.features.billing.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.billing.domain.PricingRule;
import com.transportplatform.tms.features.billing.domain.PricingRuleStatus;
import java.time.LocalDate;
import org.springframework.http.HttpStatus;

public final class PricingRuleStatusWorkflow {

    private PricingRuleStatusWorkflow() {
    }

    public static void ensureCanActivate(PricingRule pricingRule, LocalDate today) {
        PricingRuleStatus currentStatus = resolveEffectiveStatus(pricingRule, today);
        if (currentStatus != PricingRuleStatus.DRAFT
                && currentStatus != PricingRuleStatus.SUSPENDED
                && currentStatus != PricingRuleStatus.INACTIVE) {
            throw invalidTransition("Only draft, suspended, or inactive pricing rules can be activated.");
        }
        if (pricingRule.getEffectiveEndDate() != null && pricingRule.getEffectiveEndDate().isBefore(today)) {
            throw invalidTransition("A pricing rule with a past effective end date cannot be activated.");
        }
    }

    public static void ensureCanSuspend(PricingRule pricingRule, LocalDate today) {
        if (resolveEffectiveStatus(pricingRule, today) != PricingRuleStatus.ACTIVE) {
            throw invalidTransition("Only active pricing rules can be suspended.");
        }
    }

    public static void ensureCanDeactivate(PricingRuleStatus currentStatus) {
        if (currentStatus == PricingRuleStatus.INACTIVE) {
            throw invalidTransition("Pricing rule is already inactive.");
        }
    }

    public static PricingRuleStatus resolveEffectiveStatus(PricingRule pricingRule, LocalDate today) {
        if ((pricingRule.getStatus() == PricingRuleStatus.ACTIVE
                || pricingRule.getStatus() == PricingRuleStatus.SUSPENDED)
                && pricingRule.getEffectiveEndDate() != null
                && pricingRule.getEffectiveEndDate().isBefore(today)) {
            return PricingRuleStatus.EXPIRED;
        }
        return pricingRule.getStatus();
    }

    private static ApiException invalidTransition(String message) {
        return new ApiException(ErrorCode.INVALID_STATUS_TRANSITION, HttpStatus.BAD_REQUEST, message);
    }
}
