package com.transportplatform.tms.features.auth.application;

import com.transportplatform.tms.features.auth.domain.AppUser;
import com.transportplatform.tms.features.auth.domain.AppUserRepository;
import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.auth.domain.UserStatus;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

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
            return;
        }

        if (appUserRepository.existsForTenantAndEmail(null, properties.getEmail())) {
            return;
        }

        AppUser user = new AppUser();
        user.setEmail(properties.getEmail().trim().toLowerCase());
        user.setFirstName("Platform");
        user.setLastName("Administrator");
        user.setPasswordHash(passwordEncoder.encode(properties.getPassword()));
        user.setStatus(UserStatus.ACTIVE);
        user.setRoles(Set.of(RoleName.ROLE_PLATFORM_ADMIN));
        appUserRepository.save(user);

        LOGGER.info("Bootstrapped platform admin account with email {}", properties.getEmail());
    }
}