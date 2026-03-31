package com.transportplatform.tms.features.settings.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.features.settings.api.request.CompanySettingsUpdateRequest;
import com.transportplatform.tms.features.settings.api.response.CompanySettingsResponse;
import com.transportplatform.tms.features.settings.application.CompanySettingsService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CompanySettingsController {

    private final CompanySettingsService companySettingsService;

    public CompanySettingsController(CompanySettingsService companySettingsService) {
        this.companySettingsService = companySettingsService;
    }

    @GetMapping("/company/settings")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<CompanySettingsResponse> getCompanySettings() {
        return ApiResponse.success(companySettingsService.getCompanySettings());
    }

    @PutMapping("/company/settings")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<CompanySettingsResponse> updateCompanySettings(
            @Valid @RequestBody CompanySettingsUpdateRequest request) {
        return ApiResponse.success(companySettingsService.updateCompanySettings(request));
    }
}