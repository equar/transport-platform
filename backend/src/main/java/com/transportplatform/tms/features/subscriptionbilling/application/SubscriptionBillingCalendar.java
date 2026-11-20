package com.transportplatform.tms.features.subscriptionbilling.application;

import java.math.BigDecimal;
import java.time.*;

public final class SubscriptionBillingCalendar {
  private SubscriptionBillingCalendar() {}

  public static LocalDate nextRenewal(LocalDate current, int anchorDay) {
    YearMonth next = YearMonth.from(current).plusMonths(1);
    return next.atDay(Math.min(anchorDay, next.lengthOfMonth()));
  }

  public static BigDecimal amount(BigDecimal monthlyRate, int activeDriverCount) {
    if (monthlyRate == null
        || monthlyRate.signum() < 0
        || monthlyRate.scale() > 2
        || activeDriverCount < 0)
      throw new IllegalArgumentException("Invalid USD driver billing input");
    return monthlyRate.multiply(BigDecimal.valueOf(activeDriverCount)).setScale(2);
  }
}
