package com.transportplatform.tms.features.organization.api.response;

import com.transportplatform.tms.features.organization.domain.BillingModel;
import com.transportplatform.tms.features.organization.domain.ContractStatus;
import com.transportplatform.tms.features.organization.domain.ContractType;
import com.transportplatform.tms.features.organization.domain.InvoiceFrequency;
import com.transportplatform.tms.features.organization.domain.ServiceType;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Set;

public record ContractResponse(
        Long id,
        String tenantId,
        String contractCode,
        Long organizationId,
        String organizationCode,
        String organizationName,
        ContractType contractType,
        String contractName,
        String description,
        LocalDate startDate,
        LocalDate endDate,
        LocalDate renewalDate,
        Set<ServiceType> serviceTypesCovered,
        BillingModel billingModel,
        String rateNotes,
        InvoiceFrequency invoiceFrequency,
        String serviceWindowNotes,
        String termsAndConditionsSummary,
        String notes,
        ContractStatus status,
        String createdBy,
        Instant createdAt,
        String updatedBy,
        Instant updatedAt) {
}