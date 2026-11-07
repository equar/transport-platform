package com.transportplatform.tms.features.notification.application;

import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Component;

/** Recovery and trip notifications must not silently simulate delivery in production. */
@Component
public class ProductionDeliveryConfiguration {
    public ProductionDeliveryConfiguration(Environment environment) {
        if (!environment.acceptsProfiles(Profiles.of("prod"))) return;
        for (String channel : new String[]{"email", "push"}) {
            String provider = environment.getProperty("app." + channel + ".provider", "logging");
            if (provider.isBlank() || "logging".equalsIgnoreCase(provider.trim())) {
                throw new IllegalStateException("Configure a real app." + channel
                        + ".provider before starting production. Logging adapters do not deliver notifications.");
            }
        }
    }
}
