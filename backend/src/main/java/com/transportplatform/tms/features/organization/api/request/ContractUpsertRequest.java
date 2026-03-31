package com.transportplatform.tms.features.organization.api.request;

import com.transportplatform.tms.features.organization.domain.BillingModel;
import com.transportplatform.tms.features.organization.domain.ContractType;
import com.transportplatform.tms.features.organization.domain.InvoiceFrequency;
import com.transportplatform.tms.features.organization.domain.ServiceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.Set;

public record ContractUpsertRequest(
        @NotNull(message = "Organization is required.") Long organizationId,
        @NotNull(message = "Contract type is required.") ContractType contractType,
        @NotBlank(message = "Contract name is required.") @Size(max = 150, message = "Contract name must be 150 characters or fewer.") String contractName,
        @Size(max = 2000, message = "Description must be 2000 characters or fewer.") String description,
        LocalDate startDate,
        LocalDate endDate,
        LocalDate renewalDate,
        Set<ServiceType> serviceTypesCovered,
        BillingModel billingModel,
        @Size(max = 2000, message = "Rate notes must be 2000 characters or fewer.") String rateNotes,
        InvoiceFrequency invoiceFrequency,
        @Size(max = 2000, message = "Service window notes must be 2000 characters or fewer.") String serviceWindowNotes,
        @Size(max = 4000, message = "Terms summary must be 4000 characters or fewer.") String termsAndConditionsSummary,
        @Size(max = 2000, message = "Notes must be 2000 characters or fewer.") String notes) {
}