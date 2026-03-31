package com.transportplatform.tms.features.billing.application;

import com.transportplatform.tms.features.billing.api.request.PricingRuleUpsertRequest;
import com.transportplatform.tms.features.billing.api.response.PricingRuleDetailResponse;
import com.transportplatform.tms.features.billing.api.response.PricingRuleSummaryResponse;
import com.transportplatform.tms.features.billing.domain.PricingRule;
import com.transportplatform.tms.features.billing.domain.PricingRuleStatus;
import org.springframework.stereotype.Component;

@Component
public class PricingRuleMapper {

    public void apply(PricingRule pricingRule, PricingRuleUpsertRequest request) {
        pricingRule.setName(request.name().trim());
        pricingRule.setDescription(trimToNull(request.description()));
        pricingRule.setPricingModel(request.pricingModel());
        pricingRule.setBillToType(request.billToType());
        pricingRule.setServiceType(request.serviceType());
        pricingRule.setRiderType(request.riderType());
        pricingRule.setOrganizationType(request.organizationType());
        pricingRule.setContractType(request.contractType());
        pricingRule.setTripType(request.tripType());
        pricingRule.setAmount(request.amount());
        pricingRule.setCurrency(request.currency().trim().toUpperCase());
        pricingRule.setEffectiveStartDate(request.effectiveStartDate());
        pricingRule.setEffectiveEndDate(request.effectiveEndDate());
        pricingRule.setPriorityOrder(request.priorityOrder());
        pricingRule.setNotes(trimToNull(request.notes()));
    }

    public PricingRuleSummaryResponse toSummary(PricingRule pricingRule, PricingRuleStatus effectiveStatus) {
        return new PricingRuleSummaryResponse(
                pricingRule.getId(),
                pricingRule.getTenantId(),
                pricingRule.getPricingRuleCode(),
                pricingRule.getName(),
                pricingRule.getPricingModel(),
                pricingRule.getBillToType(),
                pricingRule.getServiceType(),
                pricingRule.getAmount(),
                pricingRule.getCurrency(),
                pricingRule.getEffectiveStartDate(),
                pricingRule.getEffectiveEndDate(),
                pricingRule.getPriorityOrder(),
                effectiveStatus,
                pricingRule.getCreatedBy(),
                pricingRule.getCreatedAt(),
                pricingRule.getUpdatedBy(),
                pricingRule.getUpdatedAt());
    }

    public PricingRuleDetailResponse toDetail(PricingRule pricingRule, PricingRuleStatus effectiveStatus) {
        return new PricingRuleDetailResponse(
                pricingRule.getId(),
                pricingRule.getTenantId(),
                pricingRule.getPricingRuleCode(),
                pricingRule.getName(),
                pricingRule.getDescription(),
                pricingRule.getPricingModel(),
                pricingRule.getBillToType(),
                pricingRule.getServiceType(),
                pricingRule.getRiderType(),
                pricingRule.getOrganizationType(),
                pricingRule.getContractType(),
                pricingRule.getTripType(),
                pricingRule.getAmount(),
                pricingRule.getCurrency(),
                pricingRule.getEffectiveStartDate(),
                pricingRule.getEffectiveEndDate(),
                pricingRule.getPriorityOrder(),
                pricingRule.getNotes(),
                effectiveStatus,
                pricingRule.getCreatedBy(),
                pricingRule.getCreatedAt(),
                pricingRule.getUpdatedBy(),
                pricingRule.getUpdatedAt());
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
