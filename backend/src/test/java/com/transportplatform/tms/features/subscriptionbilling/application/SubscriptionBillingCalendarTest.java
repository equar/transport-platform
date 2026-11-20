package com.transportplatform.tms.features.subscriptionbilling.application;

import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class SubscriptionBillingCalendarTest {
  @Test
  void monthEndDoesNotDriftAfterFebruary() {
    var feb = SubscriptionBillingCalendar.nextRenewal(LocalDate.of(2027, 1, 31), 31);
    assertEquals(LocalDate.of(2027, 2, 28), feb);
    assertEquals(LocalDate.of(2027, 3, 31), SubscriptionBillingCalendar.nextRenewal(feb, 31));
    assertEquals(
        LocalDate.of(2028, 2, 29),
        SubscriptionBillingCalendar.nextRenewal(LocalDate.of(2028, 1, 31), 31));
  }

  @Test
  void exactUsdMultiplicationAndNoProration() {
    assertEquals(
        new BigDecimal("37.05"), SubscriptionBillingCalendar.amount(new BigDecimal("12.35"), 3));
    assertEquals(
        new BigDecimal("0.00"), SubscriptionBillingCalendar.amount(new BigDecimal("12.35"), 0));
    assertThrows(
        IllegalArgumentException.class,
        () -> SubscriptionBillingCalendar.amount(new BigDecimal("1.001"), 3));
    assertThrows(
        IllegalArgumentException.class,
        () -> SubscriptionBillingCalendar.amount(BigDecimal.ONE, -1));
  }
}
