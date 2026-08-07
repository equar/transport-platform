package com.transportplatform.tms.features.organization.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.organization.api.request.ContractUpsertRequest;
import com.transportplatform.tms.features.organization.api.response.ContractResponse;
import com.transportplatform.tms.features.organization.application.ContractService;
import com.transportplatform.tms.features.organization.domain.BillingModel;
import com.transportplatform.tms.features.organization.domain.ContractStatus;
import com.transportplatform.tms.features.organization.domain.ContractType;
import jakarta.validation.Valid;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ContractManagementController {

    private final ContractService contractService;

    public ContractManagementController(ContractService contractService) {
        this.contractService = contractService;
    }

    @GetMapping("/company/contracts")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<PageResponse<ContractResponse>> searchCompanyContracts(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) ContractStatus status,
            @RequestParam(required = false) ContractType contractType,
            @RequestParam(required = false) BillingModel billingModel,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "updatedAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction sortDirection) {
        return ApiResponse.success(contractService.searchCompanyContracts(
                keyword,
                status,
                contractType,
                billingModel,
                page,
                size,
                sortBy,
                sortDirection));
    }

    @GetMapping("/company/contracts/{contractId}")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<ContractResponse> getCompanyContract(@PathVariable Long contractId) {
        return ApiResponse.success(contractService.getCompanyContract(contractId));
    }

    @PostMapping("/company/contracts")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ContractResponse> createCompanyContract(@Valid @RequestBody ContractUpsertRequest request) {
        return ApiResponse.success(contractService.createCompanyContract(request));
    }

    @PutMapping("/company/contracts/{contractId}")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<ContractResponse> updateCompanyContract(@PathVariable Long contractId,
            @Valid @RequestBody ContractUpsertRequest request) {
        return ApiResponse.success(contractService.updateCompanyContract(contractId, request));
    }

    @PostMapping("/company/contracts/{contractId}/activate")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<ContractResponse> activateCompanyContract(@PathVariable Long contractId) {
        return ApiResponse.success(contractService.activateCompanyContract(contractId));
    }

    @PostMapping("/company/contracts/{contractId}/suspend")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<ContractResponse> suspendCompanyContract(@PathVariable Long contractId) {
        return ApiResponse.success(contractService.suspendCompanyContract(contractId));
    }

    @PostMapping("/company/contracts/{contractId}/terminate")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<ContractResponse> terminateCompanyContract(@PathVariable Long contractId) {
        return ApiResponse.success(contractService.terminateCompanyContract(contractId));
    }

    @PostMapping("/company/contracts/{contractId}/deactivate")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<ContractResponse> deactivateCompanyContract(@PathVariable Long contractId) {
        return ApiResponse.success(contractService.deactivateCompanyContract(contractId));
    }
}
