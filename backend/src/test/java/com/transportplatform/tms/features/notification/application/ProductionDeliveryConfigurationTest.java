package com.transportplatform.tms.features.notification.application;
import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

class ProductionDeliveryConfigurationTest {
    @Test void rejectsSimulatedProductionDelivery() {
        MockEnvironment environment = new MockEnvironment(); environment.setActiveProfiles("prod");
        assertThrows(IllegalStateException.class, () -> new ProductionDeliveryConfiguration(environment));
        environment.setProperty("app.email.provider", "microsoft-graph");
        assertThrows(IllegalStateException.class, () -> new ProductionDeliveryConfiguration(environment));
        environment.setProperty("app.push.provider", "expo");
        assertDoesNotThrow(() -> new ProductionDeliveryConfiguration(environment));
    }
    @Test void permitsLocalLogging() {
        assertDoesNotThrow(() -> new ProductionDeliveryConfiguration(new MockEnvironment()));
    }
}
