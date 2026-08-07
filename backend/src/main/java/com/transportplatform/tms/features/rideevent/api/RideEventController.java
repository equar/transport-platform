package com.transportplatform.tms.features.rideevent.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.features.ride.api.response.RideResponse;
import com.transportplatform.tms.features.ride.application.RideService;
import com.transportplatform.tms.features.rideevent.api.request.AddRideEventNoteRequest;
import com.transportplatform.tms.features.rideevent.api.response.RideEventResponse;
import com.transportplatform.tms.features.rideevent.application.RideEventService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RideEventController {

    private final RideEventService rideEventService;
    private final RideService rideService;

    public RideEventController(RideEventService rideEventService, RideService rideService) {
        this.rideEventService = rideEventService;
        this.rideService = rideService;
    }

    @GetMapping("/company/rides/{rideId}/events")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<List<RideEventResponse>> getCompanyRideEvents(@PathVariable Long rideId) {
        return ApiResponse.success(rideEventService.getCompanyRideEvents(rideId));
    }

    @PostMapping("/company/rides/{rideId}/events/notes")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'DISPATCHER')")
    public ApiResponse<RideResponse> addCompanyRideEventNote(@PathVariable Long rideId,
            @Valid @RequestBody AddRideEventNoteRequest request) {
        rideService.addCompanyRideNote(rideId, request.notes());
        return ApiResponse.success(rideService.getCompanyRide(rideId));
    }
}
