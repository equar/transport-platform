package com.transportplatform.tms.features.billing.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.features.billing.domain.BillToType;
import com.transportplatform.tms.features.billing.domain.ChargeSourceType;
import com.transportplatform.tms.features.billing.domain.PricingModel;
import com.transportplatform.tms.features.billing.domain.PricingRule;
import com.transportplatform.tms.features.billing.domain.PricingRuleRepository;
import com.transportplatform.tms.features.billing.domain.PricingRuleStatus;
import com.transportplatform.tms.features.organization.domain.ServiceType;
import com.transportplatform.tms.features.rider.domain.RiderType;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;

@ExtendWith(MockitoExtension.class)
class BillingCalculationServiceTest {

    @Mock
    private PricingRuleRepository pricingRuleRepository;

    private BillingCalculationService billingCalculationService;

    @BeforeEach
    void setUp() {
        billingCalculationService = new BillingCalculationService(
                pricingRuleRepository,
                Clock.fixed(Instant.parse("2026-03-31T12:00:00Z"), ZoneOffset.UTC));
    }

    @Test
    void selectApplicableRulePrefersMoreSpecificMatchWhenPriorityMatches() {
        PricingRule genericRule = pricingRule("RULE-GENERIC", BigDecimal.valueOf(12), 10);
        PricingRule specificRule = pricingRule("RULE-STUDENT", BigDecimal.valueOf(15), 10);
        specificRule.setRiderType(RiderType.STUDENT);

        when(pricingRuleRepository.findAll(any(Specification.class))).thenReturn(List.of(genericRule, specificRule));

        PricingRule selectedRule = billingCalculationService.selectApplicableRule(
                "tenant-123",
                new BillingCalculationService.CalculationCriteria(
                        BillToType.RIDER,
                        ServiceType.NEMT,
                        RiderType.STUDENT,
                        null,
                        null,
                        null,
                        LocalDate.of(2026, 3, 31)));

        assertEquals("RULE-STUDENT", selectedRule.getPricingRuleCode());
    }

    @Test
    void computeChargeUsesWholeCoveredWeeksForWeeklyPricing() {
        PricingRule pricingRule = pricingRule("RULE-WEEKLY", BigDecimal.valueOf(25), 1);
        pricingRule.setPricingModel(PricingModel.PER_WEEK);

        BillingCalculationService.ComputedCharge computedCharge = billingCalculationService.computeCharge(
                pricingRule,
                new BillingCalculationService.CalculationInput(
                        BigDecimal.ONE,
                        0,
                        0,
                        LocalDate.of(2026, 3, 1),
                        LocalDate.of(2026, 3, 15),
                        ChargeSourceType.ROUTE,
                        77L));

        assertEquals(new BigDecimal("3"), computedCharge.quantity());
        assertEquals(new BigDecimal("25.00"), computedCharge.unitPrice());
        assertEquals(new BigDecimal("75.00"), computedCharge.lineAmount());
        assertEquals(ChargeSourceType.ROUTE, computedCharge.chargeSourceType());
        assertEquals(77L, computedCharge.sourceReferenceId());
    }

    @Test
    void selectApplicableRuleThrowsWhenNoRuleMatches() {
        when(pricingRuleRepository.findAll(any(Specification.class))).thenReturn(List.of());

        ApiException exception = assertThrows(ApiException.class,
                () -> billingCalculationService.selectApplicableRule(
                        "tenant-123",
                        new BillingCalculationService.CalculationCriteria(
                                BillToType.ORGANIZATION,
                                ServiceType.SCHOOL_TRANSPORT,
                                null,
                                null,
                                null,
                                null,
                                LocalDate.of(2026, 3, 31))));

        assertEquals("RESOURCE_NOT_FOUND", exception.getErrorCode().name());
    }

    private PricingRule pricingRule(String code, BigDecimal amount, int priorityOrder) {
        PricingRule pricingRule = new PricingRule();
        pricingRule.setTenantId("tenant-123");
        pricingRule.setPricingRuleCode(code);
        pricingRule.setName(code);
        pricingRule.setPricingModel(PricingModel.FLAT_RATE);
        pricingRule.setBillToType(BillToType.RIDER);
        pricingRule.setServiceType(ServiceType.NEMT);
        pricingRule.setAmount(amount.setScale(2));
        pricingRule.setCurrency("USD");
        pricingRule.setEffectiveStartDate(LocalDate.of(2026, 1, 1));
        pricingRule.setPriorityOrder(priorityOrder);
        pricingRule.setStatus(PricingRuleStatus.ACTIVE);
        return pricingRule;
    }
}