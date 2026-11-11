package com.transportplatform.tms.features.companyapplication.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.features.companyapplication.application.TenantEmailVerificationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/auth")
public class TenantEmailVerificationController {
    private final TenantEmailVerificationService service;

    public TenantEmailVerificationController(TenantEmailVerificationService service) { this.service = service; }

    public record VerifyRequest(
            @NotBlank @Pattern(regexp = "[A-Za-z0-9_-]{43}") String token,
            @NotBlank @Size(min = 8, max = 100) String password) {}
    public record ResendRequest(@NotBlank @Email @Size(max = 150) String email) {}

    @PostMapping("/verify-email")
    public ApiResponse<String> verify(@Valid @RequestBody VerifyRequest request) {
        return ApiResponse.success(service.verify(request.token(), request.password()));
    }

    @PostMapping("/resend-verification")
    public ApiResponse<String> resend(@Valid @RequestBody ResendRequest request) {
        return ApiResponse.success(service.resend(request.email()));
    }
}
