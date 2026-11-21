package com.transportplatform.tms.common.config;

import org.springframework.boot.autoconfigure.flyway.FlywayConfigurationCustomizer;
import org.springframework.context.annotation.*;
import org.springframework.core.env.*;

@Configuration
public class DevelopmentSeedConfiguration {
    @Bean
    FlywayConfigurationCustomizer explicitDevelopmentSeed(Environment environment) {
        return configuration -> {
            boolean enabled = environment.getProperty("app.dev-seed.enabled", Boolean.class, false);
            if (enabled
                    && (!environment.acceptsProfiles(Profiles.of("local", "dev"))
                            || environment.acceptsProfiles(Profiles.of("prod"))))
                throw new IllegalStateException(
                        "Demo seeding is allowed only with an explicit opt-in in a disposable"
                                + " local/dev environment.");
            if (enabled) configuration.locations("classpath:db/migration", "classpath:db/devdata");
        };
    }
}
