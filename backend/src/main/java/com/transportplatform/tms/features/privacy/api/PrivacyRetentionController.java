package com.transportplatform.tms.features.privacy.api;

import static com.transportplatform.tms.features.privacy.api.PrivacyRetentionRecords.*;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.features.privacy.application.PrivacyRetentionService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
public class PrivacyRetentionController {
  private final PrivacyRetentionService service;

  public PrivacyRetentionController(PrivacyRetentionService service) {
    this.service = service;
  }

  @GetMapping("/platform/privacy-retention")
  @PreAuthorize("hasRole('PLATFORM_ADMIN')")
  public ApiResponse<PrivacyRetentionView> platform() {
    return ApiResponse.success(service.view("PLATFORM"));
  }

  @PutMapping("/platform/privacy-retention")
  @PreAuthorize("hasRole('PLATFORM_ADMIN')")
  public ApiResponse<PrivacyRetentionView> platformSave(
      @Valid @RequestBody PrivacyRetentionRequest request) {
    return ApiResponse.success(service.save("PLATFORM", request));
  }

  @GetMapping("/company/privacy-retention")
  @PreAuthorize("hasRole('TENANT_ADMIN')")
  public ApiResponse<PrivacyRetentionView> company() {
    return ApiResponse.success(service.view(service.tenant()));
  }

  @PutMapping("/company/privacy-retention")
  @PreAuthorize("hasRole('TENANT_ADMIN')")
  public ApiResponse<PrivacyRetentionView> companySave(
      @Valid @RequestBody PrivacyRetentionRequest request) {
    return ApiResponse.success(service.save(service.tenant(), request));
  }

  @GetMapping("/company/privacy-retention/review-candidates")
  @PreAuthorize("hasRole('TENANT_ADMIN')")
  public ApiResponse<List<PrivacyReviewCandidate>> review() {
    return ApiResponse.success(service.reviewCandidates(service.tenant()));
  }

  @PostMapping("/company/privacy-retention/reviews")
  @PreAuthorize("hasRole('TENANT_ADMIN')")
  public ApiResponse<String> reviewed(@Valid @RequestBody PrivacyReviewRequest request) {
    service.review(service.tenant(), request);
    return ApiResponse.success("Retention review recorded.");
  }
}
