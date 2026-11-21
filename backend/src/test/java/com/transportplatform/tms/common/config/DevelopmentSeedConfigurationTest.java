package com.transportplatform.tms.common.config;

import static org.assertj.core.api.Assertions.*;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

class DevelopmentSeedConfigurationTest {
    @Test
    void seedRequiresExplicitDevelopmentOptInAndIsForbiddenInProduction() {
        var config = new DevelopmentSeedConfiguration();
        var environment = new MockEnvironment();
        environment.setActiveProfiles("dev");
        var flyway = Flyway.configure().locations("classpath:db/migration");
        config.explicitDevelopmentSeed(environment).customize(flyway);
        assertThat(flyway.getLocations())
                .extracting(Object::toString)
                .containsExactly("classpath:db/migration");
        environment.setProperty("app.dev-seed.enabled", "true");
        config.explicitDevelopmentSeed(environment).customize(flyway);
        assertThat(flyway.getLocations())
                .extracting(Object::toString)
                .contains("classpath:db/devdata");
        environment.setActiveProfiles("prod", "dev");
        assertThatThrownBy(() -> config.explicitDevelopmentSeed(environment).customize(flyway))
                .isInstanceOf(IllegalStateException.class);
        environment.setActiveProfiles();
        assertThatThrownBy(() -> config.explicitDevelopmentSeed(environment).customize(flyway))
                .isInstanceOf(IllegalStateException.class);
    }
}
