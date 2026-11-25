package com.transportplatform.tms.features.vehicle.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.vehicle.api.request.VehicleDocumentReviewRequest;
import com.transportplatform.tms.features.vehicle.api.request.VehicleDocumentUpsertRequest;
import com.transportplatform.tms.features.vehicle.api.response.VehicleDocumentResponse;
import com.transportplatform.tms.features.vehicle.application.VehicleDocumentService;
import com.transportplatform.tms.features.vehicle.domain.VehicleDocumentStatus;
import com.transportplatform.tms.features.vehicle.domain.VehicleDocumentType;
import com.transportplatform.tms.features.vehicle.domain.VehicleDocumentVerificationStatus;
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
public class VehicleDocumentController {

    private final VehicleDocumentService vehicleDocumentService;

    public VehicleDocumentController(VehicleDocumentService vehicleDocumentService) {
        this.vehicleDocumentService = vehicleDocumentService;
    }

    @PostMapping(value="/company/vehicles/{vehicleId}/documents/upload", consumes="multipart/form-data")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER', 'COMPLIANCE_ADMIN')")
    public ApiResponse<VehicleDocumentResponse> upload(@PathVariable Long vehicleId,
            @RequestParam VehicleDocumentType documentType,
            @RequestParam(required=false) String documentNumber, @RequestParam(required=false) String issuingAuthority,
            @RequestParam(required=false) java.time.LocalDate issueDate, @RequestParam(required=false) java.time.LocalDate expiryDate,
            @RequestParam(required=false) String notes, @RequestParam org.springframework.web.multipart.MultipartFile file) {
        return ApiResponse.success(vehicleDocumentService.uploadCompanyVehicleDocument(vehicleId, documentType,
                documentNumber, issuingAuthority, issueDate, expiryDate, notes, file));
    }

    @GetMapping("/company/vehicle-documents/{documentId}/file")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER', 'COMPLIANCE_ADMIN')")
    public org.springframework.http.ResponseEntity<org.springframework.core.io.Resource> file(@PathVariable Long documentId) {
        var stored = vehicleDocumentService.loadCompanyVehicleDocumentFile(documentId);
        return org.springframework.http.ResponseEntity.ok().header("Cache-Control", "no-store")
                .contentType(org.springframework.http.MediaType.parseMediaType(stored.contentType()))
                .header("Content-Disposition", "inline; filename*=UTF-8''" + java.net.URLEncoder.encode(stored.fileName(), java.nio.charset.StandardCharsets.UTF_8))
                .body(stored.resource());
    }

    @GetMapping("/company/vehicles/{vehicleId}/documents")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER', 'COMPLIANCE_ADMIN')")
    public ApiResponse<PageResponse<VehicleDocumentResponse>> searchCompanyVehicleDocuments(
            @PathVariable Long vehicleId,
            @RequestParam(required = false) VehicleDocumentType documentType,
            @RequestParam(required = false) VehicleDocumentVerificationStatus verificationStatus,
            @RequestParam(required = false) VehicleDocumentStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.success(vehicleDocumentService.searchCompanyVehicleDocuments(
                vehicleId,
                documentType,
                verificationStatus,
                status,
                page,
                size));
    }

    @GetMapping("/company/vehicle-documents/{documentId}")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER', 'COMPLIANCE_ADMIN')")
    public ApiResponse<VehicleDocumentResponse> getCompanyVehicleDocument(@PathVariable Long documentId) {
        return ApiResponse.success(vehicleDocumentService.getCompanyVehicleDocument(documentId));
    }

    @PostMapping("/company/vehicles/{vehicleId}/documents")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER', 'COMPLIANCE_ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<VehicleDocumentResponse> createCompanyVehicleDocument(@PathVariable Long vehicleId,
            @Valid @RequestBody VehicleDocumentUpsertRequest request) {
        return ApiResponse.success(vehicleDocumentService.createCompanyVehicleDocument(vehicleId, request));
    }

    @PutMapping("/company/vehicle-documents/{documentId}")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER', 'COMPLIANCE_ADMIN')")
    public ApiResponse<VehicleDocumentResponse> updateCompanyVehicleDocument(@PathVariable Long documentId,
            @Valid @RequestBody VehicleDocumentUpsertRequest request) {
        return ApiResponse.success(vehicleDocumentService.updateCompanyVehicleDocument(documentId, request));
    }

    @PostMapping("/company/vehicle-documents/{documentId}/verify")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER', 'COMPLIANCE_ADMIN')")
    public ApiResponse<VehicleDocumentResponse> verifyCompanyVehicleDocument(@PathVariable Long documentId,
            @Valid @RequestBody VehicleDocumentReviewRequest request) {
        return ApiResponse.success(vehicleDocumentService.verifyCompanyVehicleDocument(documentId, request));
    }

    @PostMapping("/company/vehicle-documents/{documentId}/reject")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER', 'COMPLIANCE_ADMIN')")
    public ApiResponse<VehicleDocumentResponse> rejectCompanyVehicleDocument(@PathVariable Long documentId,
            @Valid @RequestBody VehicleDocumentReviewRequest request) {
        return ApiResponse.success(vehicleDocumentService.rejectCompanyVehicleDocument(documentId, request));
    }

    @PostMapping("/company/vehicle-documents/{documentId}/activate")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER', 'COMPLIANCE_ADMIN')")
    public ApiResponse<VehicleDocumentResponse> activateCompanyVehicleDocument(@PathVariable Long documentId) {
        return ApiResponse.success(vehicleDocumentService.activateCompanyVehicleDocument(documentId));
    }

    @PostMapping("/company/vehicle-documents/{documentId}/archive")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER', 'COMPLIANCE_ADMIN')")
    public ApiResponse<VehicleDocumentResponse> archiveCompanyVehicleDocument(@PathVariable Long documentId) {
        return ApiResponse.success(vehicleDocumentService.archiveCompanyVehicleDocument(documentId));
    }
}
