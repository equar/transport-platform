package com.transportplatform.tms.features.rider.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.features.rider.api.request.RiderGuardianUpsertRequest;
import com.transportplatform.tms.features.rider.api.response.GuardianLinkedRiderResponse;
import com.transportplatform.tms.features.rider.api.response.RiderGuardianResponse;
import com.transportplatform.tms.features.rider.application.RiderRelationshipService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RiderGuardianController {

    private final RiderRelationshipService riderRelationshipService;

    public RiderGuardianController(RiderRelationshipService riderRelationshipService) {
        this.riderRelationshipService = riderRelationshipService;
    }

    @GetMapping("/company/riders/{riderId}/guardians")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<List<RiderGuardianResponse>> listGuardiansForRider(@PathVariable Long riderId) {
        return ApiResponse.success(riderRelationshipService.listGuardiansForRider(riderId));
    }

    @GetMapping("/company/guardians/{guardianId}/riders")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<List<GuardianLinkedRiderResponse>> listRidersForGuardian(@PathVariable Long guardianId) {
        return ApiResponse.success(riderRelationshipService.listRidersForGuardian(guardianId));
    }

    @PostMapping("/company/riders/{riderId}/guardians")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<RiderGuardianResponse> linkGuardianToRider(@PathVariable Long riderId,
            @Valid @RequestBody RiderGuardianUpsertRequest request) {
        return ApiResponse.success(riderRelationshipService.linkGuardianToRider(riderId, request));
    }

    @PutMapping("/company/rider-guardians/{relationshipId}")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RiderGuardianResponse> updateRiderGuardian(@PathVariable Long relationshipId,
            @Valid @RequestBody RiderGuardianUpsertRequest request) {
        return ApiResponse.success(riderRelationshipService.updateRiderGuardian(relationshipId, request));
    }

    @PostMapping("/company/rider-guardians/{relationshipId}/unlink")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RiderGuardianResponse> unlinkRiderGuardian(@PathVariable Long relationshipId) {
        return ApiResponse.success(riderRelationshipService.unlinkRiderGuardian(relationshipId));
    }
}
