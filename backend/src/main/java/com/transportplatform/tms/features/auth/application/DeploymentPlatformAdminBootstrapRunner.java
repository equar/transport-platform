package com.transportplatform.tms.features.auth.application;

import java.util.Arrays;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("prod")
public class DeploymentPlatformAdminBootstrapRunner implements ApplicationRunner {
    private static final Logger LOG = LoggerFactory.getLogger(DeploymentPlatformAdminBootstrapRunner.class);
    private final PlatformAdminBootstrapProperties properties;
    private final DeploymentPlatformAdminBootstrapService service;
    public DeploymentPlatformAdminBootstrapRunner(PlatformAdminBootstrapProperties properties,
            DeploymentPlatformAdminBootstrapService service) {
        this.properties = properties; this.service = service;
    }
    @Override
    public void run(ApplicationArguments args) {
        if (!properties.isEmailEnabled()) return;
        if (properties.isEnabled()) throw new IllegalStateException("Enable only one platform administrator bootstrap mode.");
        String emails = properties.getEmails();
        if (emails == null || emails.isBlank()) throw new IllegalStateException("Configure platform administrator bootstrap emails.");
        // Validate the entire list before creating any account.
        var identities = Arrays.stream(emails.split(",", -1))
                .map(DeploymentPlatformAdminBootstrapService::normalizeEmail).distinct().toList();
        int created = 0;
        for (String email : identities) if (service.bootstrap(email)) created++;
        LOG.info("System administrator bootstrap completed: {} created, {} existing identities skipped.", created, identities.size() - created);
    }
}
