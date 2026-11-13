package com.transportplatform.tms.common.security;

import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Component;

/** Required product channels must never silently simulate successful production delivery. */
@Component
public class ProductionDeliveryValidator {
    public ProductionDeliveryValidator(Environment environment) {
        if (!environment.acceptsProfiles(Profiles.of("prod"))) return;
        if (!environment.getProperty("app.email.enabled", Boolean.class, false)
                || !"microsoft-graph".equals(environment.getProperty("app.email.provider"))) {
            throw new IllegalStateException("Production requires configured email delivery; disabled/logging email is development-only.");
        }
        if (!environment.getProperty("app.push.enabled", Boolean.class, false)
                || !"expo".equals(environment.getProperty("app.push.provider"))) {
            throw new IllegalStateException("Production requires configured Expo push delivery; disabled/logging push is development-only.");
        }
    }
}
