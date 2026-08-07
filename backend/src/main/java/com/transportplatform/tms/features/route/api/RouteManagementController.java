package com.transportplatform.tms.features.route.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.organization.domain.ServiceType;
import com.transportplatform.tms.features.route.api.request.AddRouteStopRequest;
import com.transportplatform.tms.features.route.api.request.AssignRouteResourcesRequest;
import com.transportplatform.tms.features.route.api.request.ReorderRouteStopsRequest;
import com.transportplatform.tms.features.route.api.request.RouteUpsertRequest;
import com.transportplatform.tms.features.route.api.request.UpdateRouteStopRequest;
import com.transportplatform.tms.features.route.api.response.RouteResponse;
import com.transportplatform.tms.features.route.api.response.RouteSummaryResponse;
import com.transportplatform.tms.features.route.application.RouteService;
import com.transportplatform.tms.features.route.domain.RouteStatus;
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
public class RouteManagementController {

    private final RouteService routeService;

    public RouteManagementController(RouteService routeService) {
        this.routeService = routeService;
    }

    @GetMapping("/company/routes")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<PageResponse<RouteSummaryResponse>> searchCompanyRoutes(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) RouteStatus status,
            @RequestParam(required = false) ServiceType serviceType,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(required = false) Long driverId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "routeDate") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction sortDirection) {
        return ApiResponse.success(routeService.searchCompanyRoutes(
                keyword,
                status,
                serviceType,
                fromDate,
                toDate,
                driverId,
                page,
                size,
                sortBy,
                sortDirection));
    }

    @GetMapping("/company/routes/{routeId}")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RouteResponse> getCompanyRoute(@PathVariable Long routeId) {
        return ApiResponse.success(routeService.getCompanyRoute(routeId));
    }

    @PostMapping("/company/routes")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<RouteResponse> createCompanyRoute(@Valid @RequestBody RouteUpsertRequest request) {
        return ApiResponse.success(routeService.createCompanyRoute(request));
    }

    @PutMapping("/company/routes/{routeId}")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RouteResponse> updateCompanyRoute(@PathVariable Long routeId,
            @Valid @RequestBody RouteUpsertRequest request) {
        return ApiResponse.success(routeService.updateCompanyRoute(routeId, request));
    }

    @PostMapping("/company/routes/{routeId}/assign-resources")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RouteResponse> assignCompanyRouteResources(@PathVariable Long routeId,
            @Valid @RequestBody AssignRouteResourcesRequest request) {
        return ApiResponse.success(routeService.assignCompanyRouteResources(routeId, request));
    }

    @PostMapping("/company/routes/{routeId}/unassign-driver")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RouteResponse> unassignCompanyRouteDriver(@PathVariable Long routeId) {
        return ApiResponse.success(routeService.unassignCompanyRouteDriver(routeId));
    }

    @PostMapping("/company/routes/{routeId}/unassign-vehicle")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RouteResponse> unassignCompanyRouteVehicle(@PathVariable Long routeId) {
        return ApiResponse.success(routeService.unassignCompanyRouteVehicle(routeId));
    }

    @PostMapping("/company/routes/{routeId}/ready")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RouteResponse> markCompanyRouteReady(@PathVariable Long routeId) {
        return ApiResponse.success(routeService.markCompanyRouteReady(routeId));
    }

    @PostMapping("/company/routes/{routeId}/start")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RouteResponse> startCompanyRoute(@PathVariable Long routeId) {
        return ApiResponse.success(routeService.startCompanyRoute(routeId));
    }

    @PostMapping("/company/routes/{routeId}/complete")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RouteResponse> completeCompanyRoute(@PathVariable Long routeId) {
        return ApiResponse.success(routeService.completeCompanyRoute(routeId));
    }

    @PostMapping("/company/routes/{routeId}/cancel")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RouteResponse> cancelCompanyRoute(@PathVariable Long routeId) {
        return ApiResponse.success(routeService.cancelCompanyRoute(routeId));
    }

    @PostMapping("/company/routes/{routeId}/stops")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RouteResponse> addRideToCompanyRoute(@PathVariable Long routeId,
            @Valid @RequestBody AddRouteStopRequest request) {
        return ApiResponse.success(routeService.addRideToCompanyRoute(routeId, request));
    }

    @PutMapping("/company/routes/{routeId}/stops/{routeStopId}")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RouteResponse> updateCompanyRouteStop(@PathVariable Long routeId,
            @PathVariable Long routeStopId,
            @Valid @RequestBody UpdateRouteStopRequest request) {
        return ApiResponse.success(routeService.updateCompanyRouteStop(routeId, routeStopId, request));
    }

    @PostMapping("/company/routes/{routeId}/stops/reorder")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RouteResponse> reorderCompanyRouteStops(@PathVariable Long routeId,
            @Valid @RequestBody ReorderRouteStopsRequest request) {
        return ApiResponse.success(routeService.reorderCompanyRouteStops(routeId, request));
    }

    @PostMapping("/company/routes/{routeId}/stops/{routeStopId}/remove")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RouteResponse> removeRideFromCompanyRoute(@PathVariable Long routeId,
            @PathVariable Long routeStopId) {
        return ApiResponse.success(routeService.removeRideFromCompanyRoute(routeId, routeStopId));
    }
}
