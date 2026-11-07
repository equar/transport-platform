package com.transportplatform.tms.features.billing.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.billing.domain.BillToType;
import com.transportplatform.tms.features.billing.domain.ChargeSourceType;
import com.transportplatform.tms.features.billing.domain.PricingModel;
import com.transportplatform.tms.features.billing.domain.PricingRule;
import com.transportplatform.tms.features.billing.domain.PricingRuleRepository;
import com.transportplatform.tms.features.organization.domain.ContractType;
import com.transportplatform.tms.features.organization.domain.OrganizationType;
import com.transportplatform.tms.features.organization.domain.ServiceType;
import com.transportplatform.tms.features.rider.domain.RiderType;
import com.transportplatform.tms.features.ride.domain.RideTripType;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class BillingCalculationService {

    private final PricingRuleRepository pricingRuleRepository;
    private final Clock clock;

    public BillingCalculationService(PricingRuleRepository pricingRuleRepository, Clock clock) {
        this.pricingRuleRepository = pricingRuleRepository;
        this.clock = clock;
    }

    public PricingRule selectApplicableRule(String tenantId, CalculationCriteria criteria) {
        LocalDate referenceDate = criteria.referenceDate() == null ? LocalDate.now(clock) : criteria.referenceDate();
        return pricingRuleRepository.findAll(PricingRuleSpecifications.activeCandidates(
                tenantId,
                criteria.billToType(),
                referenceDate)).stream()
                .filter(rule -> matches(rule.getServiceType(), criteria.serviceType()))
                .filter(rule -> matches(rule.getRiderType(), criteria.riderType()))
                .filter(rule -> matches(rule.getOrganizationType(), criteria.organizationType()))
                .filter(rule -> matches(rule.getContractType(), criteria.contractType()))
                .filter(rule -> matches(rule.getTripType(), criteria.tripType()))
                .sorted(Comparator
                        .comparing(PricingRule::getPriorityOrder)
                        .thenComparing((PricingRule rule) -> specificity(rule, criteria), Comparator.reverseOrder())
                        .thenComparing(PricingRule::getUpdatedAt, Comparator.reverseOrder()))
                .findFirst()
                .orElseThrow(() -> new ApiException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        HttpStatus.NOT_FOUND,
                        "No active pricing rule matched the selected billing context."));
    }

    public ComputedCharge computeCharge(PricingRule pricingRule, CalculationInput input) {
        BigDecimal quantity = resolveQuantity(pricingRule.getPricingModel(), input);
        BigDecimal unitPrice = pricingRule.getAmount().setScale(2, RoundingMode.HALF_UP);
        BigDecimal lineAmount = unitPrice.multiply(quantity).setScale(2, RoundingMode.HALF_UP);
        return new ComputedCharge(
                quantity,
                unitPrice,
                lineAmount,
                resolveChargeSourceType(input),
                input.sourceReferenceId());
    }

    private BigDecimal resolveQuantity(PricingModel pricingModel, CalculationInput input) {
        return switch (pricingModel) {
            case FLAT_RATE, CUSTOM -> defaultPositive(input.quantity(), BigDecimal.ONE);
            case PER_TRIP -> BigDecimal.valueOf(Math.max(1, input.tripCount()));
            case PER_WEEK -> BigDecimal.valueOf(Math.max(1, calculateWeeks(input.periodStart(), input.periodEnd())));
            case PER_MONTH -> BigDecimal.valueOf(Math.max(1, calculateMonths(input.periodStart(), input.periodEnd())));
            case PER_ROUTE -> defaultPositive(input.quantity(), BigDecimal.ONE);
            case PER_RIDER -> BigDecimal.valueOf(Math.max(1, input.riderCount()));
        };
    }

    private long calculateWeeks(LocalDate start, LocalDate end) {
        if (start == null || end == null || end.isBefore(start)) {
            return 1;
        }
        long days = ChronoUnit.DAYS.between(start, end) + 1;
        return (long) Math.ceil(days / 7.0);
    }

    private long calculateMonths(LocalDate start, LocalDate end) {
        if (start == null || end == null || end.isBefore(start)) {
            return 1;
        }
        return ChronoUnit.MONTHS.between(YearMonth.from(start), YearMonth.from(end)) + 1;
    }

    private int specificity(PricingRule rule, CalculationCriteria criteria) {
        int score = 0;
        if (rule.getServiceType() != null && criteria.serviceType() != null) {
            score++;
        }
        if (rule.getRiderType() != null && criteria.riderType() != null) {
            score++;
        }
        if (rule.getOrganizationType() != null && criteria.organizationType() != null) {
            score++;
        }
        if (rule.getContractType() != null && criteria.contractType() != null) {
            score++;
        }
        if (rule.getTripType() != null && criteria.tripType() != null) {
            score++;
        }
        return score;
    }

    private <T> boolean matches(T ruleValue, T criteriaValue) {
        return ruleValue == null || ruleValue.equals(criteriaValue);
    }

    private BigDecimal defaultPositive(BigDecimal value, BigDecimal defaultValue) {
        if (value == null || value.compareTo(BigDecimal.ZERO) <= 0) {
            return defaultValue;
        }
        return value;
    }

    private ChargeSourceType resolveChargeSourceType(CalculationInput input) {
        if (input.sourceType() != null) {
            return input.sourceType();
        }
        if (input.sourceReferenceId() != null) {
            return ChargeSourceType.OTHER;
        }
        return ChargeSourceType.MANUAL;
    }

    public record CalculationCriteria(
            BillToType billToType,
            ServiceType serviceType,
            RiderType riderType,
            OrganizationType organizationType,
            ContractType contractType,
            RideTripType tripType,
            LocalDate referenceDate) {
    }

    public record CalculationInput(
            BigDecimal quantity,
            int tripCount,
            int riderCount,
            LocalDate periodStart,
            LocalDate periodEnd,
            ChargeSourceType sourceType,
            Long sourceReferenceId) {
    }

    public record ComputedCharge(
            BigDecimal quantity,
            BigDecimal unitPrice,
            BigDecimal lineAmount,
            ChargeSourceType chargeSourceType,
            Long sourceReferenceId) {
    }
}
