package com.transportplatform.tms.common.security;

import java.time.Duration;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.security")
public class SecurityProperties {

    private List<String> allowedOrigins = List.of();
    private boolean apiDocsEnabled;
    private final Jwt jwt = new Jwt();
    private final PasswordReset passwordReset = new PasswordReset();
    private final RateLimit rateLimit = new RateLimit();

    public List<String> getAllowedOrigins() {
        return allowedOrigins;
    }

    public void setAllowedOrigins(List<String> allowedOrigins) {
        this.allowedOrigins = allowedOrigins;
    }

    public boolean isApiDocsEnabled() {
        return apiDocsEnabled;
    }

    public void setApiDocsEnabled(boolean apiDocsEnabled) {
        this.apiDocsEnabled = apiDocsEnabled;
    }

    public Jwt getJwt() {
        return jwt;
    }

    public PasswordReset getPasswordReset() {
        return passwordReset;
    }

    public RateLimit getRateLimit() {
        return rateLimit;
    }

    public static class PasswordReset {

        private String publicUrl = "http://localhost:5173/reset-password";
        private Duration ttl = Duration.ofHours(1);

        public String getPublicUrl() {
            return publicUrl;
        }

        public void setPublicUrl(String publicUrl) {
            this.publicUrl = publicUrl;
        }

        public Duration getTtl() {
            return ttl;
        }

        public void setTtl(Duration ttl) {
            this.ttl = ttl;
        }
    }

    public static class RateLimit {

        private boolean enabled = true;
        private final Policy login = new Policy(10, Duration.ofMinutes(1));
        private final Policy refresh = new Policy(20, Duration.ofMinutes(1));
        private final Policy companyApplication = new Policy(3, Duration.ofMinutes(15));

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }

        public Policy getLogin() {
            return login;
        }

        public Policy getRefresh() {
            return refresh;
        }

        public Policy getCompanyApplication() {
            return companyApplication;
        }
    }

    public static class Policy {

        private int capacity;
        private Duration window;

        public Policy() {
        }

        public Policy(int capacity, Duration window) {
            this.capacity = capacity;
            this.window = window;
        }

        public int getCapacity() {
            return capacity;
        }

        public void setCapacity(int capacity) {
            this.capacity = capacity;
        }

        public Duration getWindow() {
            return window;
        }

        public void setWindow(Duration window) {
            this.window = window;
        }
    }

    public static class Jwt {

        private String issuer = "transport-platform";
        private String secret;
        private Duration accessTokenTtl = Duration.ofMinutes(15);
        private Duration refreshTokenTtl = Duration.ofDays(7);

        public String getIssuer() {
            return issuer;
        }

        public void setIssuer(String issuer) {
            this.issuer = issuer;
        }

        public String getSecret() {
            return secret;
        }

        public void setSecret(String secret) {
            this.secret = secret;
        }

        public Duration getAccessTokenTtl() {
            return accessTokenTtl;
        }

        public void setAccessTokenTtl(Duration accessTokenTtl) {
            this.accessTokenTtl = accessTokenTtl;
        }

        public Duration getRefreshTokenTtl() {
            return refreshTokenTtl;
        }

        public void setRefreshTokenTtl(Duration refreshTokenTtl) {
            this.refreshTokenTtl = refreshTokenTtl;
        }
    }
}
