package com.transportplatform.tms.features.incident.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.incident.api.request.IncidentStatusActionRequest;
import com.transportplatform.tms.features.incident.api.request.IncidentUpsertRequest;
import com.transportplatform.tms.features.incident.api.response.IncidentDetailResponse;
import com.transportplatform.tms.features.incident.api.response.IncidentReferenceDataResponse;
import com.transportplatform.tms.features.incident.api.response.IncidentSummaryResponse;
import com.transportplatform.tms.features.incident.application.IncidentService;
import com.transportplatform.tms.features.incident.domain.IncidentSeverity;
import com.transportplatform.tms.features.incident.domain.IncidentStatus;
import com.transportplatform.tms.features.incident.domain.IncidentType;
import jakarta.validation.Valid;
import java.time.LocalDate;
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
public class IncidentManagementController {

    private final IncidentService incidentService;

    public IncidentManagementController(IncidentService incidentService) {
        this.incidentService = incidentService;
    }

    @GetMapping("/company/incidents")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<PageResponse<IncidentSummaryResponse>> searchCompanyIncidents(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) IncidentStatus status,
            @RequestParam(required = false) IncidentSeverity severity,
            @RequestParam(required = false) IncidentType incidentType,
            @RequestParam(required = false) Long assignedToUserId,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "reportedAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction sortDirection) {
        return ApiResponse.success(incidentService.searchCompanyIncidents(
                keyword,
                status,
                severity,
                incidentType,
                assignedToUserId,
                fromDate,
                toDate,
                page,
                size,
                sortBy,
                sortDirection));
    }

    @GetMapping("/company/incidents/reference-data")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<IncidentReferenceDataResponse> getReferenceData() {
        return ApiResponse.success(incidentService.getReferenceData());
    }

    @GetMapping("/company/incidents/{incidentId}")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<IncidentDetailResponse> getCompanyIncident(@PathVariable Long incidentId) {
        return ApiResponse.success(incidentService.getCompanyIncident(incidentId));
    }

    @PostMapping("/company/incidents")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<IncidentDetailResponse> createCompanyIncident(
            @Valid @RequestBody IncidentUpsertRequest request) {
        return ApiResponse.success(incidentService.createCompanyIncident(request));
    }

    @PutMapping("/company/incidents/{incidentId}")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<IncidentDetailResponse> updateCompanyIncident(@PathVariable Long incidentId,
            @Valid @RequestBody IncidentUpsertRequest request) {
        return ApiResponse.success(incidentService.updateCompanyIncident(incidentId, request));
    }

    @PostMapping("/company/incidents/{incidentId}/in-review")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<IncidentDetailResponse> moveToInReview(@PathVariable Long incidentId,
            @Valid @RequestBody(required = false) IncidentStatusActionRequest request) {
        return ApiResponse.success(incidentService.moveToInReview(incidentId, request));
    }

    @PostMapping("/company/incidents/{incidentId}/escalate")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<IncidentDetailResponse> escalate(@PathVariable Long incidentId,
            @Valid @RequestBody(required = false) IncidentStatusActionRequest request) {
        return ApiResponse.success(incidentService.escalate(incidentId, request));
    }

    @PostMapping("/company/incidents/{incidentId}/resolve")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<IncidentDetailResponse> resolve(@PathVariable Long incidentId,
            @Valid @RequestBody IncidentStatusActionRequest request) {
        return ApiResponse.success(incidentService.resolve(incidentId, request));
    }

    @PostMapping("/company/incidents/{incidentId}/close")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<IncidentDetailResponse> close(@PathVariable Long incidentId,
            @Valid @RequestBody(required = false) IncidentStatusActionRequest request) {
        return ApiResponse.success(incidentService.close(incidentId, request));
    }

    @PostMapping("/company/incidents/{incidentId}/dismiss")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<IncidentDetailResponse> dismiss(@PathVariable Long incidentId,
            @Valid @RequestBody(required = false) IncidentStatusActionRequest request) {
        return ApiResponse.success(incidentService.dismiss(incidentId, request));
    }

    @PostMapping("/company/incidents/{incidentId}/reopen")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<IncidentDetailResponse> reopen(@PathVariable Long incidentId,
            @Valid @RequestBody(required = false) IncidentStatusActionRequest request) {
        return ApiResponse.success(incidentService.reopen(incidentId, request));
    }
}