package com.transportplatform.tms.features.tripevidence.api;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class TripEvidenceRecords {
  private TripEvidenceRecords() {}

  @Schema(name = "TripVerifiedStopsRequest")
  public record Stops(
      @NotNull @DecimalMin("-90") @DecimalMax("90") Double pickupLatitude,
      @NotNull @DecimalMin("-180") @DecimalMax("180") Double pickupLongitude,
      @NotNull @DecimalMin("-90") @DecimalMax("90") Double dropoffLatitude,
      @NotNull @DecimalMin("-180") @DecimalMax("180") Double dropoffLongitude) {}

  @Schema(name = "TripMilestoneEvidenceRequest")
  public record Capture(
      @NotBlank @Pattern(regexp = "ARRIVED|PICKED_UP|DROPPED_OFF") String milestone,
      @DecimalMin("0") @Digits(integer = 8, fraction = 1) BigDecimal odometerMiles,
      @NotNull Boolean mockedLocation) {}

  @Schema(name = "TripDeliveryConfirmationRequest")
  public record Confirmation(@NotNull Long dropoffEvidenceId, @AssertTrue boolean delivered) {}

  @Schema(name = "TripMilestoneEvidence")
  public record Milestone(
      long id,
      String milestone,
      double distanceMeters,
      double accuracyMeters,
      BigDecimal odometerMiles,
      Instant recordedAt,
      Instant consumedAt) {}

  @Schema(name = "TripDeliveryConfirmation")
  public record Confirmed(String confirmerName, String subjectType, Instant confirmedAt) {}

  @Schema(name = "TripEvidenceSummary")
  public record Summary(
      Stops stops,
      List<Milestone> milestones,
      Confirmed confirmation,
      boolean canConfirm,
      boolean readyToComplete) {}
}
