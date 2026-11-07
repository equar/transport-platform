package com.transportplatform.tms.features.ride.api;
import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.features.ride.domain.RideStatus;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@RestController
public class RideActionsController {
    public record Action(String action,String label) {}
    @GetMapping("/runtime/ride-actions")
    public ApiResponse<Map<RideStatus,Action>> actions() {
        return ApiResponse.success(Map.of(
            RideStatus.ASSIGNED,new Action("driver-en-route","Mark En Route"),
            RideStatus.DRIVER_EN_ROUTE,new Action("arrived","Mark Arrived"),
            RideStatus.ARRIVED,new Action("picked-up","Confirm Pickup"),
            RideStatus.PICKED_UP,new Action("dropped-off","Confirm Drop Off"),
            RideStatus.DROPPED_OFF,new Action("complete","Complete Ride")));
    }
}
