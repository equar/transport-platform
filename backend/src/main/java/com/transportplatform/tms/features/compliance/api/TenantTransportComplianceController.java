package com.transportplatform.tms.features.compliance.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.features.compliance.api.request.TenantTransportComplianceRequest;
import com.transportplatform.tms.features.compliance.api.request.TransportComplianceDecisionRequest;
import com.transportplatform.tms.features.compliance.api.response.TenantTransportComplianceResponse;
import com.transportplatform.tms.features.compliance.application.TenantTransportComplianceService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TenantTransportComplianceController {
    private final TenantTransportComplianceService service;
    public TenantTransportComplianceController(TenantTransportComplianceService service) { this.service = service; }

    @GetMapping("/company/transport-compliance")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<TenantTransportComplianceResponse> current() { return ApiResponse.success(service.getCurrentTenantProfile()); }

    @PutMapping("/company/transport-compliance")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<TenantTransportComplianceResponse> attest(@Valid @RequestBody TenantTransportComplianceRequest request) {
        return ApiResponse.success(service.attest(request));
    }

    @GetMapping("/platform/tenants/{tenantId}/transport-compliance")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    public ApiResponse<TenantTransportComplianceResponse> platformView(@PathVariable String tenantId) {
        return ApiResponse.success(service.getForPlatform(tenantId));
    }

    @PostMapping("/platform/tenants/{tenantId}/transport-compliance/decision")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    public ApiResponse<TenantTransportComplianceResponse> decide(@PathVariable String tenantId,
            @Valid @RequestBody TransportComplianceDecisionRequest request) {
        return ApiResponse.success(service.decide(tenantId, request));
    }
}
