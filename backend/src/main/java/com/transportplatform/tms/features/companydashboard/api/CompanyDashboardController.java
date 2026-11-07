package com.transportplatform.tms.features.companydashboard.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.features.companydashboard.application.CompanyDashboardService;
import com.transportplatform.tms.features.companydashboard.application.CompanyDashboardSummaryResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/company/dashboard")
@PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER', 'BILLING_ADMIN', 'COMPLIANCE_ADMIN')")
public class CompanyDashboardController {

    private final CompanyDashboardService companyDashboardService;

    public CompanyDashboardController(CompanyDashboardService companyDashboardService) {
        this.companyDashboardService = companyDashboardService;
    }

    @GetMapping("/summary")
    public ApiResponse<CompanyDashboardSummaryResponse> getSummary() {
        return ApiResponse.success(companyDashboardService.getSummary());
    }
}
