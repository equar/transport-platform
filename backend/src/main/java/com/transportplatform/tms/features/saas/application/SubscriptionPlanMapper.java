package com.transportplatform.tms.features.saas.application;

import com.transportplatform.tms.features.saas.api.request.SubscriptionPlanUpsertRequest;
import com.transportplatform.tms.features.saas.api.response.SubscriptionPlanDetailResponse;
import com.transportplatform.tms.features.saas.api.response.SubscriptionPlanSummaryResponse;
import com.transportplatform.tms.features.saas.domain.SubscriptionPlan;
import java.math.RoundingMode;
import java.util.LinkedHashSet;
import org.springframework.stereotype.Component;

@Component
public class SubscriptionPlanMapper {

    public void apply(SubscriptionPlan plan, SubscriptionPlanUpsertRequest request) {
        plan.setName(request.name().trim());
        plan.setDescription(trimToNull(request.description()));
        plan.setTier(request.tier());
        plan.setMonthlyPrice(request.monthlyPrice().setScale(2, RoundingMode.HALF_UP));
        plan.setAnnualPrice(request.annualPrice().setScale(2, RoundingMode.HALF_UP));
        plan.setCurrency(request.currency().trim().toUpperCase());
        plan.setMaxUsers(request.maxUsers());
        plan.setMaxDrivers(request.maxDrivers());
        plan.setMaxVehicles(request.maxVehicles());
        plan.setMaxRiders(request.maxRiders());
        plan.setMaxOrganizations(request.maxOrganizations());
        plan.setIncludedFeatureCodes(new LinkedHashSet<>(
                request.includedFeatureCodes() == null
                        ? java.util.Set.<String>of()
                        : request.includedFeatureCodes().stream()
                                .filter(value -> value != null && !value.isBlank())
                                .map(value -> value.trim().toUpperCase())
                                .toList()));
        plan.setNotes(trimToNull(request.notes()));
    }

    public SubscriptionPlanSummaryResponse toSummary(SubscriptionPlan plan) {
        return new SubscriptionPlanSummaryResponse(
                plan.getId(),
                plan.getPlanCode(),
                plan.getName(),
                plan.getTier(),
                plan.getMonthlyPrice(),
                plan.getAnnualPrice(),
                plan.getCurrency(),
                plan.getMaxUsers(),
                plan.getMaxDrivers(),
                plan.getMaxVehicles(),
                plan.getStatus(),
                plan.getCreatedAt(),
                plan.getUpdatedAt());
    }

    public SubscriptionPlanDetailResponse toDetail(SubscriptionPlan plan) {
        return new SubscriptionPlanDetailResponse(
                plan.getId(),
                plan.getPlanCode(),
                plan.getName(),
                plan.getDescription(),
                plan.getTier(),
                plan.getMonthlyPrice(),
                plan.getAnnualPrice(),
                plan.getCurrency(),
                plan.getMaxUsers(),
                plan.getMaxDrivers(),
                plan.getMaxVehicles(),
                plan.getMaxRiders(),
                plan.getMaxOrganizations(),
                plan.getIncludedFeatureCodes(),
                plan.getNotes(),
                plan.getStatus(),
                plan.getCreatedBy(),
                plan.getCreatedAt(),
                plan.getUpdatedBy(),
                plan.getUpdatedAt());
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}