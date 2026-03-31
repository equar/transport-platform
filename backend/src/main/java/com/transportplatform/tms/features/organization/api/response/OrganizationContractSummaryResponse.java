package com.transportplatform.tms.features.organization.api.response;

import com.transportplatform.tms.features.organization.domain.BillingModel;
import com.transportplatform.tms.features.organization.domain.ContractStatus;
import com.transportplatform.tms.features.organization.domain.ContractType;
import java.time.LocalDate;

public record OrganizationContractSummaryResponse(
        Long id,
        String contractCode,
        String contractName,
        ContractType contractType,
        BillingModel billingModel,
        LocalDate startDate,
        LocalDate endDate,
        ContractStatus status) {
}