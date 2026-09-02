package com.transportplatform.tms.features.driverportal.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.driverportal.api.request.DriverPortalProfileUpdateRequest;
import com.transportplatform.tms.features.driverportal.api.request.DriverPortalRideNoteRequest;
import com.transportplatform.tms.features.driverportal.api.response.DriverPortalComplianceSummaryResponse;
import com.transportplatform.tms.features.driverportal.api.response.DriverPortalDashboardResponse;
import com.transportplatform.tms.features.driverportal.api.response.DriverPortalProfileResponse;
import com.transportplatform.tms.features.driverportal.api.response.DriverPortalRideDetailResponse;
import com.transportplatform.tms.features.driverportal.api.response.DriverPortalRideSummaryResponse;
import com.transportplatform.tms.features.driverportal.api.response.DriverPortalRouteDetailResponse;
import com.transportplatform.tms.features.driverportal.api.response.DriverPortalRouteSummaryResponse;
import com.transportplatform.tms.features.driverportal.api.response.DriverPortalDocumentResponse;
import com.transportplatform.tms.features.driver.domain.DriverDocumentType;
import com.transportplatform.tms.features.location.api.request.DriverLocationSnapshotRequest;
import com.transportplatform.tms.features.location.api.response.DriverLocationSnapshotResponse;
import com.transportplatform.tms.features.location.application.DriverLocationSnapshotService;
import com.transportplatform.tms.features.driverportal.application.DriverPortalService;
import com.transportplatform.tms.features.driverportal.application.DriverActionIdempotencyService;
import com.transportplatform.tms.features.ride.domain.RideStatus;
import com.transportplatform.tms.features.route.domain.RouteStatus;
import jakarta.validation.Valid;
import java.time.LocalDate;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RequestHeader;
import java.util.function.Supplier;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.ResponseStatus;

@RestController
@PreAuthorize("hasRole('DRIVER')")
public class DriverPortalController {

    private final DriverPortalService driverPortalService;
    private final DriverLocationSnapshotService driverLocationSnapshotService;
    private final DriverActionIdempotencyService idempotencyService;

    public DriverPortalController(DriverPortalService driverPortalService,
            DriverLocationSnapshotService driverLocationSnapshotService,
            DriverActionIdempotencyService idempotencyService) {
        this.driverPortalService = driverPortalService;
        this.driverLocationSnapshotService = driverLocationSnapshotService;
        this.idempotencyService = idempotencyService;
    }

    @GetMapping("/portal/driver/dashboard")
    public ApiResponse<DriverPortalDashboardResponse> getDashboard() {
        return ApiResponse.success(driverPortalService.getDashboard());
    }

    @GetMapping("/portal/driver/profile")
    public ApiResponse<DriverPortalProfileResponse> getProfile() {
        return ApiResponse.success(driverPortalService.getProfile());
    }

    @PutMapping("/portal/driver/profile")
    public ApiResponse<DriverPortalProfileResponse> updateProfile(
            @Valid @RequestBody DriverPortalProfileUpdateRequest request) {
        return ApiResponse.success(driverPortalService.updateProfile(request));
    }

    @GetMapping("/portal/driver/compliance")
    public ApiResponse<DriverPortalComplianceSummaryResponse> getComplianceSummary() {
        return ApiResponse.success(driverPortalService.getComplianceSummary());
    }

    @PostMapping(value = "/portal/driver/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<DriverPortalDocumentResponse> uploadDocument(
            @RequestParam DriverDocumentType documentType,
            @RequestParam(required = false) String documentNumber,
            @RequestParam(required = false) String issuingAuthority,
            @RequestParam(required = false) LocalDate issueDate,
            @RequestParam(required = false) LocalDate expiryDate,
            @RequestParam(required = false) String notes,
            @RequestPart("file") MultipartFile file) {
        return ApiResponse.success(driverPortalService.uploadDocument(documentType, documentNumber,
                issuingAuthority, issueDate, expiryDate, notes, file));
    }

    @GetMapping("/portal/driver/rides")
    public ApiResponse<PageResponse<DriverPortalRideSummaryResponse>> searchMyRides(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) RideStatus status,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "scheduledPickupAt") String sortBy,
            @RequestParam(defaultValue = "ASC") Sort.Direction sortDirection) {
        return ApiResponse.success(driverPortalService.searchMyRides(
                keyword,
                status,
                fromDate,
                toDate,
                page,
                size,
                sortBy,
                sortDirection));
    }

    @GetMapping("/portal/driver/rides/{rideId}")
    public ApiResponse<DriverPortalRideDetailResponse> getMyRide(@PathVariable Long rideId) {
        return ApiResponse.success(driverPortalService.getMyRide(rideId));
    }

    @PostMapping("/portal/driver/rides/{rideId}/actions/driver-en-route")
    public ApiResponse<DriverPortalRideDetailResponse> markRideDriverEnRoute(@PathVariable Long rideId,
            @RequestHeader(value = "Idempotency-Key", required = false) String key) {
        return action(rideId, key, "driver-en-route", () -> driverPortalService.markRideDriverEnRoute(rideId));
    }

    @PostMapping("/portal/driver/rides/{rideId}/actions/arrived")
    public ApiResponse<DriverPortalRideDetailResponse> markRideArrived(@PathVariable Long rideId,
            @RequestHeader(value = "Idempotency-Key", required = false) String key) {
        return action(rideId, key, "arrived", () -> driverPortalService.markRideArrived(rideId));
    }

    @PostMapping("/portal/driver/rides/{rideId}/actions/picked-up")
    public ApiResponse<DriverPortalRideDetailResponse> markRidePickedUp(@PathVariable Long rideId,
            @RequestHeader(value = "Idempotency-Key", required = false) String key) {
        return action(rideId, key, "picked-up", () -> driverPortalService.markRidePickedUp(rideId));
    }

    @PostMapping("/portal/driver/rides/{rideId}/actions/dropped-off")
    public ApiResponse<DriverPortalRideDetailResponse> markRideDroppedOff(@PathVariable Long rideId,
            @RequestHeader(value = "Idempotency-Key", required = false) String key) {
        return action(rideId, key, "dropped-off", () -> driverPortalService.markRideDroppedOff(rideId));
    }

    @PostMapping("/portal/driver/rides/{rideId}/actions/complete")
    public ApiResponse<DriverPortalRideDetailResponse> completeRide(@PathVariable Long rideId,
            @RequestHeader(value = "Idempotency-Key", required = false) String key) {
        return action(rideId, key, "complete", () -> driverPortalService.completeRide(rideId));
    }

    @PostMapping("/portal/driver/rides/{rideId}/actions/no-show")
    public ApiResponse<DriverPortalRideDetailResponse> markRideNoShow(@PathVariable Long rideId,
            @RequestHeader(value = "Idempotency-Key", required = false) String key) {
        return action(rideId, key, "no-show", () -> driverPortalService.markRideNoShow(rideId));
    }

    @PostMapping("/portal/driver/rides/{rideId}/actions/failed")
    public ApiResponse<DriverPortalRideDetailResponse> markRideFailed(@PathVariable Long rideId,
            @RequestHeader(value = "Idempotency-Key", required = false) String key) {
        return action(rideId, key, "failed", () -> driverPortalService.markRideFailed(rideId));
    }

    @GetMapping("/portal/driver/rides/{rideId}/location-snapshot")
    public ApiResponse<DriverLocationSnapshotResponse> getRideLocationSnapshot(@PathVariable Long rideId) {
        return ApiResponse.success(driverLocationSnapshotService.getLatestDriverRideSnapshot(rideId));
    }

    @PostMapping("/portal/driver/rides/{rideId}/location-snapshots")
    public ApiResponse<DriverLocationSnapshotResponse> captureRideLocationSnapshot(@PathVariable Long rideId,
            @Valid @RequestBody DriverLocationSnapshotRequest request) {
        return ApiResponse.success(driverLocationSnapshotService.captureDriverRideSnapshot(rideId, request));
    }

    @PostMapping("/portal/driver/rides/{rideId}/notes")
    public ApiResponse<DriverPortalRideDetailResponse> addRideNote(
            @PathVariable Long rideId,
            @Valid @RequestBody DriverPortalRideNoteRequest request) {
        return ApiResponse.success(driverPortalService.addRideNote(rideId, request.note()));
    }

    @GetMapping("/portal/driver/routes")
    public ApiResponse<PageResponse<DriverPortalRouteSummaryResponse>> searchMyRoutes(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) RouteStatus status,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "routeDate") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction sortDirection) {
        return ApiResponse.success(driverPortalService.searchMyRoutes(
                keyword,
                status,
                fromDate,
                toDate,
                page,
                size,
                sortBy,
                sortDirection));
    }

    @GetMapping("/portal/driver/routes/{routeId}")
    public ApiResponse<DriverPortalRouteDetailResponse> getMyRoute(@PathVariable Long routeId) {
        return ApiResponse.success(driverPortalService.getMyRoute(routeId));
    }

    private ApiResponse<DriverPortalRideDetailResponse> action(Long rideId, String key, String action,
            Supplier<DriverPortalRideDetailResponse> operation) {
        return ApiResponse.success(idempotencyService.execute(key, rideId, action, operation,
                () -> driverPortalService.getMyRide(rideId)));
    }
}
