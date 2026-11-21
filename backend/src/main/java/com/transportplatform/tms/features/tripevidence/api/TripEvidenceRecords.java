package com.transportplatform.tms.features.tripevidence.api;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import jakarta.validation.Valid;
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
  public record Confirmation(@NotNull @Positive Long dropoffEvidenceId, @AssertTrue boolean delivered,
      @Valid Signature signature) {
    public Confirmation(Long dropoffEvidenceId, boolean delivered) { this(dropoffEvidenceId, delivered, null); }
  }

  @Schema(name = "TripDeliverySignaturePoint")
  public record Point(double x, double y) {}

  @Schema(name = "TripDeliverySignature")
  public record Signature(@NotNull @Size(min = 1, max = 32) List<@NotNull @Size(min = 2, max = 500) List<@NotNull Point>> strokes) {
    @AssertTrue(message = "Draw a signature, or continue without signing.")
    @com.fasterxml.jackson.annotation.JsonIgnore
    public boolean isValid() {
      if (strokes == null || strokes.isEmpty() || strokes.size() > 32) return false;
      int total = 0;
      for (var stroke : strokes) {
        if (stroke == null || stroke.size() < 2 || stroke.size() > 500) return false;
        total += stroke.size();
        if (total > 1000) return false;
        for (var point : stroke) {
          if (point == null || !Double.isFinite(point.x()) || !Double.isFinite(point.y())
              || point.x() < 0 || point.x() > 1 || point.y() < 0 || point.y() > 1) return false;
        }
      }
      return strokes.stream().anyMatch(stroke -> stroke.stream().anyMatch(p ->
          Math.abs(p.x() - stroke.getFirst().x()) + Math.abs(p.y() - stroke.getFirst().y()) > 0.01));
    }
  }

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
  public record Confirmed(String confirmerName, String subjectType, Instant confirmedAt, boolean signed) {
    public Confirmed(String confirmerName, String subjectType, Instant confirmedAt) {
      this(confirmerName, subjectType, confirmedAt, false);
    }
  }

  @Schema(name = "TripEvidenceSummary")
  public record Summary(
      Stops stops,
      List<Milestone> milestones,
      Confirmed confirmation,
      boolean canConfirm,
      boolean readyToComplete) {}
}
