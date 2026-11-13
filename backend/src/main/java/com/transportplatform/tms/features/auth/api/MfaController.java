package com.transportplatform.tms.features.auth.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.features.auth.application.MfaService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/auth/mfa")
public class MfaController {
    private final MfaService service;
    public MfaController(MfaService service) {this.service=service;}
    public record Proof(@NotBlank @Size(max=100) String password, @Size(max=32) String code) {}
    @GetMapping public ApiResponse<MfaService.Status> status() {return ApiResponse.success(service.status());}
    @PostMapping("/setup") public ApiResponse<MfaService.Setup> setup(@Valid @RequestBody Proof proof) {return ApiResponse.success(service.setup(proof.password()));}
    @PostMapping("/activate") public ApiResponse<MfaService.Recovery> activate(@Valid @RequestBody Proof proof) {return ApiResponse.success(service.activate(proof.password(),proof.code()));}
    @PostMapping("/disable") public ApiResponse<String> disable(@Valid @RequestBody Proof proof) {service.disable(proof.password(),proof.code());return ApiResponse.success("Authenticator disabled. Sign in again.");}
}
