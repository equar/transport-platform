package com.transportplatform.tms.features.saas.application;

import com.transportplatform.tms.features.saas.api.request.TenantSubscriptionUpsertRequest;
import com.transportplatform.tms.features.saas.api.response.TenantSubscriptionDetailResponse;
import com.transportplatform.tms.features.saas.api.response.TenantSubscriptionSummaryResponse;
import com.transportplatform.tms.features.saas.domain.TenantSubscription;
import org.springframework.stereotype.Component;

@Component
public class TenantSubscriptionMapper {

    public void apply(TenantSubscription subscription, TenantSubscriptionUpsertRequest request) {
        subscription.setEffectiveStartDate(request.effectiveStartDate());
        subscription.setEffectiveEndDate(request.effectiveEndDate());
        subscription.setRenewalDate(request.renewalDate());
        subscription.setTrial(request.isTrial());
        subscription.setTrialEndDate(request.trialEndDate());
        subscription.setNotes(trimToNull(request.notes()));
        subscription.setStatus(request.status());
    }

    public TenantSubscriptionSummaryResponse toSummary(TenantSubscription subscription) {
        return new TenantSubscriptionSummaryResponse(
                subscription.getId(),
                subscription.getTenant().getId(),
                subscription.getTenant().getTenantCode(),
                subscription.getTenant().getCompanyName(),
                subscription.getSubscriptionPlan().getId(),
                subscription.getSubscriptionPlan().getPlanCode(),
                subscription.getSubscriptionPlan().getName(),
                subscription.getSubscriptionPlan().getTier(),
                subscription.getStatus(),
                subscription.getEffectiveStartDate(),
                subscription.getEffectiveEndDate(),
                subscription.getRenewalDate(),
                subscription.isTrial(),
                subscription.getTrialEndDate(),
                subscription.getUpdatedAt());
    }

    public TenantSubscriptionDetailResponse toDetail(TenantSubscription subscription) {
        return new TenantSubscriptionDetailResponse(
                subscription.getId(),
                subscription.getTenant().getId(),
                subscription.getTenant().getTenantCode(),
                subscription.getTenant().getCompanyName(),
                subscription.getSubscriptionPlan().getId(),
                subscription.getSubscriptionPlan().getPlanCode(),
                subscription.getSubscriptionPlan().getName(),
                subscription.getSubscriptionPlan().getTier(),
                subscription.getStatus(),
                subscription.getEffectiveStartDate(),
                subscription.getEffectiveEndDate(),
                subscription.getRenewalDate(),
                subscription.isTrial(),
                subscription.getTrialEndDate(),
                subscription.getNotes(),
                subscription.getCreatedBy(),
                subscription.getCreatedAt(),
                subscription.getUpdatedBy(),
                subscription.getUpdatedAt());
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}