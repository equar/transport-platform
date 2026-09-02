package com.transportplatform.tms.common.security;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.transportplatform.tms.common.response.ApiResponse;

@RestController
public class ProtectedEndpointTestController {

    @GetMapping("/test/protected-admin")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ResponseEntity<ApiResponse<String>> protectedAdmin(@RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success("ok-" + size));
    }
}
