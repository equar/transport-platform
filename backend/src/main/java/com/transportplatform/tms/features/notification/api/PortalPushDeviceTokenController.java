package com.transportplatform.tms.features.notification.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.features.notification.api.request.PortalPushDeviceTokenDeleteRequest;
import com.transportplatform.tms.features.notification.api.request.PortalPushDeviceTokenUpsertRequest;
import com.transportplatform.tms.features.notification.application.PortalPushDeviceTokenService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@PreAuthorize("hasAnyRole('DRIVER','RIDER','GUARDIAN')")
public class PortalPushDeviceTokenController {

    private final PortalPushDeviceTokenService portalPushDeviceTokenService;

    public PortalPushDeviceTokenController(PortalPushDeviceTokenService portalPushDeviceTokenService) {
        this.portalPushDeviceTokenService = portalPushDeviceTokenService;
    }

    @PutMapping("/portal/push-token")
    public ApiResponse<String> register(@Valid @RequestBody PortalPushDeviceTokenUpsertRequest request) {
        portalPushDeviceTokenService.registerCurrentUserToken(request.token(), request.platform());
        return ApiResponse.success("Push token registered.");
    }

    @PostMapping("/portal/push-token/unregister")
    public ApiResponse<String> unregister(@Valid @RequestBody PortalPushDeviceTokenDeleteRequest request) {
        portalPushDeviceTokenService.unregisterCurrentUserToken(request.token());
        return ApiResponse.success("Push token unregistered.");
    }
}
