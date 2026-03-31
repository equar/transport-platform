package com.transportplatform.tms.features.organization.application;

import com.transportplatform.tms.features.organization.api.request.ContractUpsertRequest;
import com.transportplatform.tms.features.organization.api.response.ContractResponse;
import com.transportplatform.tms.features.organization.api.response.OrganizationContractSummaryResponse;
import com.transportplatform.tms.features.organization.domain.Contract;
import com.transportplatform.tms.features.organization.domain.ContractStatus;
import com.transportplatform.tms.features.organization.domain.Organization;
import java.util.LinkedHashSet;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class ContractMapper {

    public void apply(Contract contract, ContractUpsertRequest request, Organization organization) {
        contract.setOrganization(organization);
        contract.setContractType(request.contractType());
        contract.setContractName(request.contractName().trim());
        contract.setDescription(trimToNull(request.description()));
        contract.setStartDate(request.startDate());
        contract.setEndDate(request.endDate());
        contract.setRenewalDate(request.renewalDate());
        contract.setServiceTypesCovered(normalize(request.serviceTypesCovered()));
        contract.setBillingModel(request.billingModel());
        contract.setRateNotes(trimToNull(request.rateNotes()));
        contract.setInvoiceFrequency(request.invoiceFrequency());
        contract.setServiceWindowNotes(trimToNull(request.serviceWindowNotes()));
        contract.setTermsAndConditionsSummary(trimToNull(request.termsAndConditionsSummary()));
        contract.setNotes(trimToNull(request.notes()));
    }

    public ContractResponse toResponse(Contract contract, ContractStatus effectiveStatus) {
        return new ContractResponse(
                contract.getId(),
                contract.getTenantId(),
                contract.getContractCode(),
                contract.getOrganization().getId(),
                contract.getOrganization().getOrganizationCode(),
                contract.getOrganization().getName(),
                contract.getContractType(),
                contract.getContractName(),
                contract.getDescription(),
                contract.getStartDate(),
                contract.getEndDate(),
                contract.getRenewalDate(),
                Set.copyOf(contract.getServiceTypesCovered()),
                contract.getBillingModel(),
                contract.getRateNotes(),
                contract.getInvoiceFrequency(),
                contract.getServiceWindowNotes(),
                contract.getTermsAndConditionsSummary(),
                contract.getNotes(),
                effectiveStatus,
                contract.getCreatedBy(),
                contract.getCreatedAt(),
                contract.getUpdatedBy(),
                contract.getUpdatedAt());
    }

    public OrganizationContractSummaryResponse toSummaryResponse(Contract contract, ContractStatus effectiveStatus) {
        return new OrganizationContractSummaryResponse(
                contract.getId(),
                contract.getContractCode(),
                contract.getContractName(),
                contract.getContractType(),
                contract.getBillingModel(),
                contract.getStartDate(),
                contract.getEndDate(),
                effectiveStatus);
    }

    private Set<com.transportplatform.tms.features.organization.domain.ServiceType> normalize(
            Set<com.transportplatform.tms.features.organization.domain.ServiceType> values) {
        if (values == null || values.isEmpty()) {
            return new LinkedHashSet<>();
        }
        return new LinkedHashSet<>(values);
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}