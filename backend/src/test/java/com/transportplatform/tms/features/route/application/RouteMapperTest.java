package com.transportplatform.tms.features.route.application;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.transportplatform.tms.features.organization.domain.ServiceType;
import com.transportplatform.tms.features.route.api.request.RouteUpsertRequest;
import com.transportplatform.tms.features.route.domain.Route;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class RouteMapperTest {

    @Test
    void appliesRoutePrice() {
        Route route = new Route();
        RouteUpsertRequest request = new RouteUpsertRequest(
                "Morning Route",
                LocalDate.of(2026, 11, 16),
                ServiceType.GENERAL_TRANSPORT,
                new BigDecimal("125.50"),
                new BigDecimal("220.00"),
                null, null, null,
                null,
                null,
                null,
                null,
                null);

        new RouteMapper().apply(route, request);

        assertEquals(new BigDecimal("125.50"), route.getPrice());
        assertEquals(new BigDecimal("220.00"), route.getRoundTripPrice());
    }
}
