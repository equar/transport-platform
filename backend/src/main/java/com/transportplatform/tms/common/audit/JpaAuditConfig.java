package com.transportplatform.tms.common.audit;

import java.util.Optional;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@org.springframework.context.annotation.Import(com.transportplatform.tms.common.privacy.PrivacyConfiguration.class)
@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorAware")
public class JpaAuditConfig {

    @org.springframework.context.annotation.Bean
    public AuditorAware<String> auditorAware() {
        return () -> Optional.ofNullable(SecurityContextHolder.getContext().getAuthentication())
                .filter(Authentication::isAuthenticated)
                .map(authentication -> authentication.getPrincipal() instanceof com.transportplatform.tms.common.security.AuthenticatedUser user && user.id() != null ? "user:" + user.id() : "system")
                .filter(name -> !name.isBlank())
                .or(() -> Optional.of("system"));
    }
}
