package com.transportplatform.tms.features.platform.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.features.platform.application.PlatformDashboardService;
import com.transportplatform.tms.features.platform.application.PlatformDashboardSummaryResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/platform/dashboard")
@PreAuthorize("hasRole('PLATFORM_ADMIN')")
public class PlatformDashboardController {

    private final PlatformDashboardService platformDashboardService;

    public PlatformDashboardController(PlatformDashboardService platformDashboardService) {
        this.platformDashboardService = platformDashboardService;
    }

    @GetMapping("/summary")
    public ApiResponse<PlatformDashboardSummaryResponse> getSummary() {
        return ApiResponse.success(platformDashboardService.getSummary());
    }
}
