package com.transportplatform.tms.features.billing.api.request;

import com.transportplatform.tms.features.billing.domain.BillToType;
import com.transportplatform.tms.features.billing.domain.PricingModel;
import com.transportplatform.tms.features.organization.domain.ContractType;
import com.transportplatform.tms.features.organization.domain.OrganizationType;
import com.transportplatform.tms.features.organization.domain.ServiceType;
import com.transportplatform.tms.features.rider.domain.RiderType;
import com.transportplatform.tms.features.ride.domain.RideTripType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record PricingRuleUpsertRequest(
        @NotBlank(message = "Pricing rule name is required.") @Size(max = 150, message = "Pricing rule name must be 150 characters or fewer.") String name,
        @Size(max = 2000, message = "Description must be 2000 characters or fewer.") String description,
        @NotNull(message = "Pricing model is required.") PricingModel pricingModel,
        @NotNull(message = "Bill-to type is required.") BillToType billToType,
        ServiceType serviceType,
        RiderType riderType,
        OrganizationType organizationType,
        ContractType contractType,
        RideTripType tripType,
        @NotNull(message = "Amount is required.") @DecimalMin(value = "0.00", inclusive = false, message = "Amount must be greater than zero.") BigDecimal amount,
        @NotBlank(message = "Currency is required.") @Size(min = 3, max = 3, message = "Currency must be a 3-letter ISO code.") String currency,
        @NotNull(message = "Effective start date is required.") LocalDate effectiveStartDate,
        LocalDate effectiveEndDate,
        @NotNull(message = "Priority order is required.") Integer priorityOrder,
        @Size(max = 2000, message = "Notes must be 2000 characters or fewer.") String notes) {
}
