package com.transportplatform.tms.features.driverearnings.api;
import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.features.driverearnings.application.DriverPayoutService;
import com.transportplatform.tms.features.driverearnings.application.DriverPayoutService.*;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
@RestController
public class DriverPayoutController {
    private final DriverPayoutService service;
    public DriverPayoutController(DriverPayoutService service) { this.service=service; }
    @GetMapping("/company/drivers/{driverId}/payouts") @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<Account> account(@PathVariable long driverId) { return ApiResponse.success(service.account(driverId)); }
    @GetMapping("/portal/driver/payouts") @PreAuthorize("hasRole('DRIVER')")
    public ApiResponse<Account> mine() { return ApiResponse.success(service.mine()); }
    @PostMapping("/company/driver-payouts") @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<Account> record(@Valid @RequestBody PayoutRequest request,@RequestHeader("Idempotency-Key") String key) { return ApiResponse.success(service.record(request,key)); }
    @PostMapping("/company/driver-payouts/{id}/reverse") @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<Account> reverse(@PathVariable long id,@Valid @RequestBody Reversal request,@RequestHeader("Idempotency-Key") String key) { return ApiResponse.success(service.reverse(id,request,key)); }
}
