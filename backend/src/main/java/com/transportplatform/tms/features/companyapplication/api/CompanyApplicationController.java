package com.transportplatform.tms.features.companyapplication.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.companyapplication.api.request.CompanyApplicationReviewRequest;
import com.transportplatform.tms.features.companyapplication.api.request.CompanyApplicationSubmissionRequest;
import com.transportplatform.tms.features.companyapplication.api.response.CompanyApplicationResponse;
import com.transportplatform.tms.features.companyapplication.application.CompanyApplicationService;
import com.transportplatform.tms.features.companyapplication.domain.CompanyApplicationStatus;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CompanyApplicationController {

    private final CompanyApplicationService companyApplicationService;

    public CompanyApplicationController(CompanyApplicationService companyApplicationService) {
        this.companyApplicationService = companyApplicationService;
    }

    @PostMapping("/company-applications")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CompanyApplicationResponse> submit(
            @Valid @RequestBody CompanyApplicationSubmissionRequest request) {
        return ApiResponse.success(companyApplicationService.submit(request));
    }

    @GetMapping("/platform/company-applications")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    public ApiResponse<PageResponse<CompanyApplicationResponse>> search(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) CompanyApplicationStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.success(companyApplicationService.search(keyword, status, page, size));
    }

    @GetMapping("/platform/company-applications/{applicationId}")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    public ApiResponse<CompanyApplicationResponse> getById(@PathVariable Long applicationId) {
        return ApiResponse.success(companyApplicationService.getById(applicationId));
    }

    @PostMapping("/platform/company-applications/{applicationId}/under-review")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    public ApiResponse<CompanyApplicationResponse> moveToUnderReview(
            @PathVariable Long applicationId,
            @Valid @RequestBody CompanyApplicationReviewRequest request) {
        return ApiResponse.success(companyApplicationService.moveToUnderReview(applicationId, request));
    }

    @PostMapping("/platform/company-applications/{applicationId}/approve")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    public ApiResponse<CompanyApplicationResponse> approve(
            @PathVariable Long applicationId,
            @Valid @RequestBody CompanyApplicationReviewRequest request) {
        return ApiResponse.success(companyApplicationService.approve(applicationId, request));
    }

    @PostMapping("/platform/company-applications/{applicationId}/reject")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    public ApiResponse<CompanyApplicationResponse> reject(
            @PathVariable Long applicationId,
            @Valid @RequestBody CompanyApplicationReviewRequest request) {
        return ApiResponse.success(companyApplicationService.reject(applicationId, request));
    }
}
