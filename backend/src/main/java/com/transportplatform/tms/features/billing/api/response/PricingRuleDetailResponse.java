package com.transportplatform.tms.features.billing.api.response;

import com.transportplatform.tms.features.billing.domain.BillToType;
import com.transportplatform.tms.features.billing.domain.PricingModel;
import com.transportplatform.tms.features.billing.domain.PricingRuleStatus;
import com.transportplatform.tms.features.organization.domain.ContractType;
import com.transportplatform.tms.features.organization.domain.OrganizationType;
import com.transportplatform.tms.features.organization.domain.ServiceType;
import com.transportplatform.tms.features.rider.domain.RiderType;
import com.transportplatform.tms.features.ride.domain.RideTripType;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record PricingRuleDetailResponse(
        Long id,
        String tenantId,
        String pricingRuleCode,
        String name,
        String description,
        PricingModel pricingModel,
        BillToType billToType,
        ServiceType serviceType,
        RiderType riderType,
        OrganizationType organizationType,
        ContractType contractType,
        RideTripType tripType,
        BigDecimal amount,
        String currency,
        LocalDate effectiveStartDate,
        LocalDate effectiveEndDate,
        Integer priorityOrder,
        String notes,
        PricingRuleStatus status,
        String createdBy,
        Instant createdAt,
        String updatedBy,
        Instant updatedAt) {
}
