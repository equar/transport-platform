package com.transportplatform.tms.features.route.application;

import static org.junit.jupiter.api.Assertions.*;

import com.transportplatform.tms.features.organization.domain.ServiceType;
import com.transportplatform.tms.features.route.api.request.RouteUpsertRequest;
import com.transportplatform.tms.features.route.domain.Route;
import jakarta.validation.Validation;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class RoutePriceValidationTest {
    private RouteUpsertRequest request(BigDecimal oneWay, BigDecimal roundTrip) {
        return new RouteUpsertRequest("Morning route", LocalDate.of(2026, 11, 23),
                ServiceType.GENERAL_TRANSPORT, oneWay, roundTrip, null, null, null, null, null, null, null, null);
    }

    @Test
    void acceptsEitherPriceOrNeitherAndRejectsInvalidAmounts() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            var validator = factory.getValidator();
            assertTrue(validator.validate(request(null, null)).isEmpty());
            assertTrue(validator.validate(request(new BigDecimal("25.00"), null)).isEmpty());
            assertTrue(validator.validate(request(null, new BigDecimal("40.00"))).isEmpty());
            for (String invalid : new String[]{"-0.01", "1.001", "10000000000.00"}) {
                assertFalse(validator.validate(request(new BigDecimal(invalid), null)).isEmpty());
                assertFalse(validator.validate(request(null, new BigDecimal(invalid))).isEmpty());
            }
        }
    }

    @Test
    void clearingPricesRestoresManualPricingWithoutConvertingToZero() {
        var route = new Route();
        route.setPrice(new BigDecimal("25.00"));
        route.setRoundTripPrice(new BigDecimal("40.00"));
        new RouteMapper().apply(route, request(null, null));
        assertNull(route.getPrice());
        assertNull(route.getRoundTripPrice());
    }
}
