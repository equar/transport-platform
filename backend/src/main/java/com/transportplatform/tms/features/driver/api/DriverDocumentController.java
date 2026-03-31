package com.transportplatform.tms.features.driver.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.driver.api.request.DriverDocumentReviewRequest;
import com.transportplatform.tms.features.driver.api.request.DriverDocumentUpsertRequest;
import com.transportplatform.tms.features.driver.api.response.DriverDocumentResponse;
import com.transportplatform.tms.features.driver.application.DriverDocumentService;
import com.transportplatform.tms.features.driver.domain.DriverDocumentStatus;
import com.transportplatform.tms.features.driver.domain.DriverDocumentType;
import com.transportplatform.tms.features.driver.domain.DriverDocumentVerificationStatus;
import jakarta.validation.Valid;
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
public class DriverDocumentController {

    private final DriverDocumentService driverDocumentService;

    public DriverDocumentController(DriverDocumentService driverDocumentService) {
        this.driverDocumentService = driverDocumentService;
    }

    @GetMapping("/company/drivers/{driverId}/documents")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<PageResponse<DriverDocumentResponse>> searchCompanyDriverDocuments(
            @PathVariable Long driverId,
            @RequestParam(required = false) DriverDocumentType documentType,
            @RequestParam(required = false) DriverDocumentVerificationStatus verificationStatus,
            @RequestParam(required = false) DriverDocumentStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.success(driverDocumentService.searchCompanyDriverDocuments(
                driverId,
                documentType,
                verificationStatus,
                status,
                page,
                size));
    }

    @GetMapping("/company/driver-documents/{documentId}")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<DriverDocumentResponse> getCompanyDriverDocument(@PathVariable Long documentId) {
        return ApiResponse.success(driverDocumentService.getCompanyDriverDocument(documentId));
    }

    @PostMapping("/company/drivers/{driverId}/documents")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<DriverDocumentResponse> createCompanyDriverDocument(@PathVariable Long driverId,
            @Valid @RequestBody DriverDocumentUpsertRequest request) {
        return ApiResponse.success(driverDocumentService.createCompanyDriverDocument(driverId, request));
    }

    @PutMapping("/company/driver-documents/{documentId}")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<DriverDocumentResponse> updateCompanyDriverDocument(@PathVariable Long documentId,
            @Valid @RequestBody DriverDocumentUpsertRequest request) {
        return ApiResponse.success(driverDocumentService.updateCompanyDriverDocument(documentId, request));
    }

    @PostMapping("/company/driver-documents/{documentId}/verify")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<DriverDocumentResponse> verifyCompanyDriverDocument(@PathVariable Long documentId,
            @Valid @RequestBody DriverDocumentReviewRequest request) {
        return ApiResponse.success(driverDocumentService.verifyCompanyDriverDocument(documentId, request));
    }

    @PostMapping("/company/driver-documents/{documentId}/reject")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<DriverDocumentResponse> rejectCompanyDriverDocument(@PathVariable Long documentId,
            @Valid @RequestBody DriverDocumentReviewRequest request) {
        return ApiResponse.success(driverDocumentService.rejectCompanyDriverDocument(documentId, request));
    }

    @PostMapping("/company/driver-documents/{documentId}/activate")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<DriverDocumentResponse> activateCompanyDriverDocument(@PathVariable Long documentId) {
        return ApiResponse.success(driverDocumentService.activateCompanyDriverDocument(documentId));
    }

    @PostMapping("/company/driver-documents/{documentId}/archive")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<DriverDocumentResponse> archiveCompanyDriverDocument(@PathVariable Long documentId) {
        return ApiResponse.success(driverDocumentService.archiveCompanyDriverDocument(documentId));
    }
}