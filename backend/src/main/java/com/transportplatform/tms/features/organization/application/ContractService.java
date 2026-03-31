package com.transportplatform.tms.features.organization.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.audit.application.AuditLogCommand;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.organization.api.request.ContractUpsertRequest;
import com.transportplatform.tms.features.organization.api.response.ContractResponse;
import com.transportplatform.tms.features.organization.domain.Contract;
import com.transportplatform.tms.features.organization.domain.ContractRepository;
import com.transportplatform.tms.features.organization.domain.ContractStatus;
import com.transportplatform.tms.features.organization.domain.ContractType;
import com.transportplatform.tms.features.organization.domain.Organization;
import com.transportplatform.tms.features.organization.domain.OrganizationStatus;
import java.time.Clock;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ContractService {

    private final ContractRepository contractRepository;
    private final OrganizationAccessService organizationAccessService;
    private final OrganizationValidationService organizationValidationService;
    private final ContractMapper contractMapper;
    private final ContractCodeGenerator contractCodeGenerator;
    private final AuditLogService auditLogService;
    private final Clock clock;

    public ContractService(ContractRepository contractRepository,
            OrganizationAccessService organizationAccessService,
            OrganizationValidationService organizationValidationService,
            ContractMapper contractMapper,
            ContractCodeGenerator contractCodeGenerator,
            AuditLogService auditLogService,
            Clock clock) {
        this.contractRepository = contractRepository;
        this.organizationAccessService = organizationAccessService;
        this.organizationValidationService = organizationValidationService;
        this.contractMapper = contractMapper;
        this.contractCodeGenerator = contractCodeGenerator;
        this.auditLogService = auditLogService;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public PageResponse<ContractResponse> searchCompanyContracts(String keyword,
            ContractStatus status,
            ContractType contractType,
            com.transportplatform.tms.features.organization.domain.BillingModel billingModel,
            int page,
            int size,
            String sortBy,
            Sort.Direction sortDirection) {
        String tenantId = organizationAccessService.requireCompanyTenantId();
        LocalDate today = LocalDate.now(clock);
        var pageable = PageRequest.of(page, size, Sort.by(sortDirection, resolveSortField(sortBy)));
        var result = contractRepository.findAll(
                ContractSpecifications.search(tenantId, keyword, status, contractType, billingModel, today),
                pageable);
        return PageResponse.from(result.map(contract -> contractMapper.toResponse(
                contract,
                ContractStatusWorkflow.resolveEffectiveStatus(contract, today))));
    }

    @Transactional(readOnly = true)
    public ContractResponse getCompanyContract(Long contractId) {
        Contract contract = organizationAccessService.findContractForCompanyScope(contractId);
        return contractMapper.toResponse(contract,
                ContractStatusWorkflow.resolveEffectiveStatus(contract, LocalDate.now(clock)));
    }

    @Transactional
    public ContractResponse createCompanyContract(ContractUpsertRequest request) {
        String tenantId = organizationAccessService.requireCompanyTenantId();
        Organization organization = organizationValidationService.requireOrganizationForTenant(tenantId,
                request.organizationId());
        Contract contract = new Contract();
        contract.setTenantId(tenantId);
        contract.setContractCode(contractCodeGenerator.generate(tenantId));
        contract.setStatus(ContractStatus.DRAFT);
        contractMapper.apply(contract, request, organization);
        validateBusinessRules(contract);
        Contract saved = contractRepository.save(contract);
        recordAudit(saved, "CREATED", "Contract " + saved.getContractCode() + " was created.", null, snapshot(saved));
        return contractMapper.toResponse(saved,
                ContractStatusWorkflow.resolveEffectiveStatus(saved, LocalDate.now(clock)));
    }

    @Transactional
    public ContractResponse updateCompanyContract(Long contractId, ContractUpsertRequest request) {
        Contract contract = organizationAccessService.findContractForCompanyScope(contractId);
        Organization organization = organizationValidationService.requireOrganizationForTenant(contract.getTenantId(),
                request.organizationId());
        Object oldSnapshot = snapshot(contract);
        contractMapper.apply(contract, request, organization);
        validateBusinessRules(contract);
        Contract saved = contractRepository.save(contract);
        recordAudit(saved, "UPDATED", "Contract " + saved.getContractCode() + " was updated.", oldSnapshot,
                snapshot(saved));
        return contractMapper.toResponse(saved,
                ContractStatusWorkflow.resolveEffectiveStatus(saved, LocalDate.now(clock)));
    }

    @Transactional
    public ContractResponse activateCompanyContract(Long contractId) {
        Contract contract = organizationAccessService.findContractForCompanyScope(contractId);
        ContractStatusWorkflow.ensureCanActivate(contract, LocalDate.now(clock));
        if (contract.getOrganization().getStatus() == OrganizationStatus.INACTIVE) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST,
                    "Contracts cannot be activated for inactive organizations.");
        }
        return updateStatus(contract, ContractStatus.ACTIVE, "ACTIVATED",
                "Contract " + contract.getContractCode() + " was activated.");
    }

    @Transactional
    public ContractResponse suspendCompanyContract(Long contractId) {
        Contract contract = organizationAccessService.findContractForCompanyScope(contractId);
        ContractStatusWorkflow.ensureCanSuspend(contract, LocalDate.now(clock));
        return updateStatus(contract, ContractStatus.SUSPENDED, "SUSPENDED",
                "Contract " + contract.getContractCode() + " was suspended.");
    }

    @Transactional
    public ContractResponse terminateCompanyContract(Long contractId) {
        Contract contract = organizationAccessService.findContractForCompanyScope(contractId);
        ContractStatusWorkflow.ensureCanTerminate(contract, LocalDate.now(clock));
        return updateStatus(contract, ContractStatus.TERMINATED, "TERMINATED",
                "Contract " + contract.getContractCode() + " was terminated.");
    }

    @Transactional
    public ContractResponse deactivateCompanyContract(Long contractId) {
        Contract contract = organizationAccessService.findContractForCompanyScope(contractId);
        ContractStatusWorkflow.ensureCanDeactivate(contract.getStatus());
        return updateStatus(contract, ContractStatus.INACTIVE, "DEACTIVATED",
                "Contract " + contract.getContractCode() + " was marked inactive.");
    }

    private ContractResponse updateStatus(Contract contract, ContractStatus status, String action, String summary) {
        Object oldSnapshot = snapshot(contract);
        contract.setStatus(status);
        Contract saved = contractRepository.save(contract);
        recordAudit(saved, action, summary, oldSnapshot, snapshot(saved));
        return contractMapper.toResponse(saved,
                ContractStatusWorkflow.resolveEffectiveStatus(saved, LocalDate.now(clock)));
    }

    private void validateBusinessRules(Contract contract) {
        if (contract.getStartDate() != null && contract.getEndDate() != null
                && contract.getEndDate().isBefore(contract.getStartDate())) {
            throw validationFailure("The contract end date cannot be earlier than the start date.");
        }
        if (contract.getRenewalDate() != null && contract.getStartDate() != null
                && contract.getRenewalDate().isBefore(contract.getStartDate())) {
            throw validationFailure("The renewal date cannot be earlier than the contract start date.");
        }
    }

    private ApiException validationFailure(String message) {
        return new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST, message);
    }

    private void recordAudit(Contract contract, String action, String summary, Object oldValue, Object newValue) {
        auditLogService.record(new AuditLogCommand(
                null,
                contract.getTenantId(),
                "CONTRACT",
                action,
                "CONTRACT",
                resolveEntityId(contract),
                summary,
                oldValue,
                newValue));
    }

    private String resolveEntityId(Contract contract) {
        if (contract.getId() != null) {
            return contract.getId().toString();
        }
        return contract.getContractCode();
    }

    private Object snapshot(Contract contract) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("id", contract.getId());
        values.put("contractCode", contract.getContractCode());
        values.put("organizationId", contract.getOrganization().getId());
        values.put("organizationName", contract.getOrganization().getName());
        values.put("contractType", contract.getContractType() == null ? null : contract.getContractType().name());
        values.put("contractName", contract.getContractName());
        values.put("startDate", contract.getStartDate());
        values.put("endDate", contract.getEndDate());
        values.put("billingModel", contract.getBillingModel() == null ? null : contract.getBillingModel().name());
        values.put("invoiceFrequency",
                contract.getInvoiceFrequency() == null ? null : contract.getInvoiceFrequency().name());
        values.put("status", contract.getStatus() == null ? null : contract.getStatus().name());
        return values;
    }

    private String resolveSortField(String sortBy) {
        String resolved = sortBy == null ? "updatedAt" : sortBy;
        return switch (resolved) {
            case "createdAt", "updatedAt", "contractCode", "contractName", "startDate", "endDate", "status" -> resolved;
            default -> "updatedAt";
        };
    }
}