package com.transportplatform.tms.features.tripevidence.api;

import static com.transportplatform.tms.features.tripevidence.api.TripEvidenceRecords.*;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.features.tripevidence.application.TripEvidenceService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
public class TripEvidenceController {
  private final TripEvidenceService service;

  public TripEvidenceController(TripEvidenceService service) {
    this.service = service;
  }

  @GetMapping("/company/rides/{id}/delivery-evidence")
  @PreAuthorize("hasAnyRole('TENANT_ADMIN','DISPATCHER')")
  public ApiResponse<Summary> company(@PathVariable long id) {
    return ApiResponse.success(service.companySummary(id));
  }

  @PutMapping("/company/rides/{id}/delivery-evidence/stops")
  @PreAuthorize("hasAnyRole('TENANT_ADMIN','DISPATCHER')")
  public ApiResponse<Summary> stops(@PathVariable long id, @Valid @RequestBody Stops request) {
    return ApiResponse.success(service.configure(id, request));
  }

  @PostMapping("/company/rides/{id}/delivery-evidence/arrival-exception")
  @PreAuthorize("hasRole('TENANT_ADMIN')")
  public ApiResponse<Summary> exception(@PathVariable long id, @Valid @RequestBody ArrivalException request) {
    return ApiResponse.success(service.confirmArrivalException(id, request));
  }

  @GetMapping("/portal/driver/rides/{id}/delivery-evidence")
  @PreAuthorize("hasRole('DRIVER')")
  public ApiResponse<Summary> driver(@PathVariable long id) {
    return ApiResponse.success(service.driverSummary(id));
  }

  @PostMapping("/portal/driver/rides/{id}/delivery-evidence/milestones")
  @PreAuthorize("hasRole('DRIVER')")
  public ApiResponse<Summary> capture(@PathVariable long id, @Valid @RequestBody Capture request) {
    return ApiResponse.success(service.capture(id, request));
  }

  @GetMapping("/portal/rider/rides/{id}/delivery-evidence")
  @PreAuthorize("hasAnyRole('RIDER','GUARDIAN')")
  public ApiResponse<Summary> passenger(@PathVariable long id) {
    return ApiResponse.success(service.passengerSummary(id));
  }

  @PostMapping("/portal/rider/rides/{id}/delivery-evidence/confirm")
  @PreAuthorize("hasAnyRole('RIDER','GUARDIAN')")
  public ApiResponse<Summary> confirm(
      @PathVariable long id, @Valid @RequestBody Confirmation request) {
    return ApiResponse.success(service.confirm(id, request));
  }
}
