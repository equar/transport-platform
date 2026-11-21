package com.transportplatform.tms.features.privacy.api;

import jakarta.validation.constraints.*;
import java.time.Instant;

public final class PrivacyRetentionRecords {
  private PrivacyRetentionRecords() {}

  public record PrivacyRetentionRequest(
      @Min(1) @Max(36500) Integer operationalReviewDays,
      @Min(1) @Max(36500) Integer auditDays,
      @Min(1) @Max(36500) Integer notificationDays,
      Boolean cleanupEnabled,
      boolean legalHold,
      @Min(1) @Max(36500) Integer locationDays) {}

  public record PrivacyRetentionPolicy(
      String scope,
      Integer operationalReviewDays,
      Integer auditDays,
      Integer notificationDays,
      Boolean cleanupEnabled,
      boolean legalHold,
      @Min(1) @Max(36500) Integer locationDays) {}

  public record PrivacyRetentionView(
      PrivacyRetentionPolicy platform,
      PrivacyRetentionPolicy override,
      PrivacyRetentionPolicy effective,
      boolean platformScope) {}

  public record PrivacyReviewCandidate(String entityType, long entityId, Instant lastActivity) {}

  public record PrivacyReviewRequest(
      @NotBlank @Pattern(regexp = "RIDER|RIDE") String entityType,
      long entityId,
      @NotBlank
          @Pattern(regexp = "LEGAL_RECORDKEEPING|FINANCIAL_RECONCILIATION|ONGOING_CARE|LEGAL_HOLD")
          String reason) {}
}
