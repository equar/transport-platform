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
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER', 'COMPLIANCE_ADMIN')")
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

    @GetMapping("/company/drivers/{driverId}/documents/all")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER', 'COMPLIANCE_ADMIN')")
    public ApiResponse<List<DriverDocumentResponse>> listCompanyDriverDocuments(@PathVariable Long driverId) {
        return ApiResponse.success(driverDocumentService.listCompanyDriverDocuments(driverId));
    }

    @GetMapping("/company/driver-documents/{documentId}")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER', 'COMPLIANCE_ADMIN')")
    public ApiResponse<DriverDocumentResponse> getCompanyDriverDocument(@PathVariable Long documentId) {
        return ApiResponse.success(driverDocumentService.getCompanyDriverDocument(documentId));
    }

    @GetMapping("/company/driver-documents/{documentId}/content")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER', 'COMPLIANCE_ADMIN')")
    public ResponseEntity<org.springframework.core.io.Resource> downloadCompanyDriverDocument(
            @PathVariable Long documentId) {
        var stored = driverDocumentService.loadCompanyDriverDocumentFile(documentId);
        MediaType mediaType;
        try {
            mediaType = MediaType.parseMediaType(stored.contentType());
        } catch (Exception ignored) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename*=UTF-8''" + java.net.URLEncoder.encode(stored.fileName(), java.nio.charset.StandardCharsets.UTF_8))
                .body(stored.resource());
    }

    @PostMapping("/company/drivers/{driverId}/documents")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER', 'COMPLIANCE_ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<DriverDocumentResponse> createCompanyDriverDocument(@PathVariable Long driverId,
            @Valid @RequestBody DriverDocumentUpsertRequest request) {
        return ApiResponse.success(driverDocumentService.createCompanyDriverDocument(driverId, request));
    }

    @PutMapping("/company/driver-documents/{documentId}")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER', 'COMPLIANCE_ADMIN')")
    public ApiResponse<DriverDocumentResponse> updateCompanyDriverDocument(@PathVariable Long documentId,
            @Valid @RequestBody DriverDocumentUpsertRequest request) {
        return ApiResponse.success(driverDocumentService.updateCompanyDriverDocument(documentId, request));
    }

    @PostMapping("/company/driver-documents/{documentId}/verify")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER', 'COMPLIANCE_ADMIN')")
    public ApiResponse<DriverDocumentResponse> verifyCompanyDriverDocument(@PathVariable Long documentId,
            @Valid @RequestBody DriverDocumentReviewRequest request) {
        return ApiResponse.success(driverDocumentService.verifyCompanyDriverDocument(documentId, request));
    }

    @PostMapping("/company/driver-documents/{documentId}/reject")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER', 'COMPLIANCE_ADMIN')")
    public ApiResponse<DriverDocumentResponse> rejectCompanyDriverDocument(@PathVariable Long documentId,
            @Valid @RequestBody DriverDocumentReviewRequest request) {
        return ApiResponse.success(driverDocumentService.rejectCompanyDriverDocument(documentId, request));
    }

    @PostMapping("/company/driver-documents/{documentId}/activate")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER', 'COMPLIANCE_ADMIN')")
    public ApiResponse<DriverDocumentResponse> activateCompanyDriverDocument(@PathVariable Long documentId) {
        return ApiResponse.success(driverDocumentService.activateCompanyDriverDocument(documentId));
    }

    @PostMapping("/company/driver-documents/{documentId}/archive")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER', 'COMPLIANCE_ADMIN')")
    public ApiResponse<DriverDocumentResponse> archiveCompanyDriverDocument(@PathVariable Long documentId) {
        return ApiResponse.success(driverDocumentService.archiveCompanyDriverDocument(documentId));
    }
}
