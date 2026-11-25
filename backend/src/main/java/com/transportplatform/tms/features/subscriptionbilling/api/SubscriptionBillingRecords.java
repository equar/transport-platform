package com.transportplatform.tms.features.subscriptionbilling.api;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.List;

public final class SubscriptionBillingRecords {
  private SubscriptionBillingRecords() {}

  @Schema(name = "PlatformSubscriptionConfigure")
  public record Configure(
      @NotNull @DecimalMin("0.00") @Digits(integer = 10, fraction = 2) BigDecimal monthlyDriverRate,
      @NotNull LocalDate firstRenewalDate,
      @Min(0) @Max(90) int paymentDueDays,
      @NotBlank @Pattern(regexp = "MANUAL|AUTOMATIC") String collectionMode,
      boolean enabled) {}

  @Schema(name = "PlatformSubscriptionAccount")
  public record Account(
      long subscriptionId,
      String tenantId,
      String tenantName,
      String planCode,
      String subscriptionStatus,
      boolean enabled,
      BigDecimal monthlyDriverRate,
      String currency,
      LocalDate firstRenewalDate,
      LocalDate nextRenewalDate,
      Instant nextRenewalAt,
      Integer anchorDay,
      int paymentDueDays,
      String collectionMode,
      boolean automaticAvailable,
      long activeDrivers,
      LocalDate pendingRateDate,
      BigDecimal pendingRate) {}

  @Schema(name = "PlatformSubscriptionInvoice")
  public record Invoice(
      long id,
      long subscriptionId,
      String tenantId,
      String tenantName,
      String planCode,
      LocalDate periodStart,
      LocalDate periodEnd,
      LocalDate dueDate,
      Instant meteredAt,
      int driverCount,
      String driverIdsJson,
      BigDecimal monthlyDriverRate,
      String currency,
      BigDecimal amount,
      BigDecimal paidAmount,
      String collectionMode,
      String collectionState,
      String status,
      Instant createdAt, BigDecimal creditedAmount, BigDecimal originalAmount) {}

  @Schema(name = "PlatformSubscriptionPayment")
  public record Payment(
      long id,
      long invoiceId,
      BigDecimal amount,
      String paymentReference,
      String source,
      String recordedBy,
      Instant recordedAt) {}

  @Schema(name = "PlatformSubscriptionPaymentRequest")
  public record PaymentRequest(
      @NotNull @DecimalMin(value = "0.00", inclusive = false) @Digits(integer = 12, fraction = 2)
          BigDecimal amount,
      @NotBlank @Size(max = 150) String reference) {}

  public record Adjustment(long id, Long paymentId, String kind, BigDecimal amount, String reference,
          String reason, Instant createdAt) {}

  public record AdjustmentRequest(@NotBlank @Pattern(regexp="REFUND|PAYMENT_REVERSAL|CREDIT|CREDIT_REVERSAL") String kind,
          Long paymentId, @NotNull @DecimalMin("0.01") @Digits(integer=12,fraction=2) BigDecimal amount,
          @NotBlank @Size(max=150) String reference, @NotBlank @Size(max=2000) String reason) {}

  @Schema(name = "PlatformSubscriptionInvoiceDetail")
  public record InvoiceDetail(Invoice invoice, List<Payment> payments, List<Adjustment> adjustments) {}
}
