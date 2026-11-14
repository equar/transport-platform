package com.transportplatform.tms.features.driverearnings.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.features.driverearnings.api.request.DriverEarningsAdjustmentRequest;
import com.transportplatform.tms.features.driverearnings.api.request.DriverEarningsRateRequest;
import com.transportplatform.tms.features.driverearnings.api.request.DriverEarningsReviewRequest;
import com.transportplatform.tms.features.driverearnings.api.response.DriverEarningsEntryResponse;
import com.transportplatform.tms.features.driverearnings.api.response.DriverEarningsSummaryResponse;
import com.transportplatform.tms.features.driverearnings.application.DriverEarningsService;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DriverEarningsController {

    private final DriverEarningsService service;

    public DriverEarningsController(DriverEarningsService service) {
        this.service = service;
    }

    @GetMapping("/portal/driver/payments")
    @PreAuthorize("hasRole('DRIVER')")
    public ApiResponse<DriverEarningsSummaryResponse> mine() {
        return ApiResponse.success(service.myEarnings());
    }

    @GetMapping("/company/driver-earnings")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<List<DriverEarningsEntryResponse>> list() {
        return ApiResponse.success(service.listAdmin());
    }

    @GetMapping("/company/driver-earnings/rate")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<BigDecimal> rate() {
        return ApiResponse.success(service.getRate());
    }

    @PutMapping("/company/driver-earnings/rate")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<BigDecimal> rate(@Valid @RequestBody DriverEarningsRateRequest request) {
        return ApiResponse.success(service.updateRate(request));
    }

    @PutMapping("/company/driver-earnings/{entryId}")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<DriverEarningsEntryResponse> update(
            @PathVariable Long entryId,
            @Valid @RequestBody DriverEarningsReviewRequest request) {
        return ApiResponse.success(service.updateEntry(entryId, request));
    }

    @PostMapping("/company/driver-earnings/{entryId}/approve")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<DriverEarningsEntryResponse> approve(@PathVariable Long entryId) {
        return ApiResponse.success(service.approve(entryId));
    }

    @PostMapping("/company/driver-earnings/adjustments")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<DriverEarningsEntryResponse> adjust(
            @Valid @RequestBody DriverEarningsAdjustmentRequest request) {
        return ApiResponse.success(service.adjust(request));
    }
}
