package com.transportplatform.tms.features.auth.application;

import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.transportplatform.tms.features.auth.domain.AppUser;
import com.transportplatform.tms.features.auth.domain.AppUserRepository;
import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.auth.domain.UserStatus;

@Component
public class PlatformAdminBootstrapRunner implements ApplicationRunner {

    private static final Logger LOGGER = LoggerFactory.getLogger(PlatformAdminBootstrapRunner.class);

    private final PlatformAdminBootstrapProperties properties;
    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    public PlatformAdminBootstrapRunner(PlatformAdminBootstrapProperties properties,
            AppUserRepository appUserRepository,
            PasswordEncoder passwordEncoder) {
        this.properties = properties;
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!properties.isEnabled()) {
            LOGGER.info("Platform admin bootstrap is disabled in configuration");
            return;
        }

        String email = properties.getEmail() == null ? "" : properties.getEmail().trim().toLowerCase();
        if (email.isBlank()) {
            throw new IllegalStateException(
                    "app.bootstrap.platform-admin.email must be configured when bootstrap is enabled.");
        }

        AppUser user = appUserRepository.findForAuthenticationByEmail(email).orElse(null);
        if (user == null) {
            validateCreationPassword();
            user = new AppUser();
            user.setEmail(email);
            user.setFirstName("Platform");
            user.setLastName("Administrator");
            user.setPasswordHash(passwordEncoder.encode(properties.getPassword()));
            user.setStatus(UserStatus.ACTIVE);
            user.setRoles(Set.of(RoleName.ROLE_PLATFORM_ADMIN));
            appUserRepository.save(user);

            LOGGER.info("Bootstrapped platform admin account with email {}", email);
            return;
        }

        LOGGER.info("Platform admin account already exists for email {}", email);
    }

    private void validateCreationPassword() {
        String password = properties.getPassword();
        if (password == null || password.isBlank()) {
            throw new IllegalStateException(
                    "A bootstrap platform admin password is required when the platform admin account does not exist.");
        }
    }
}
