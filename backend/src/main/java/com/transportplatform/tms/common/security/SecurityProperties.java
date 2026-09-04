package com.transportplatform.tms.common.security;

import java.time.Duration;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.security")
public class SecurityProperties {

    private List<String> allowedOrigins = List.of();
    private boolean apiDocsEnabled;
    private final Jwt jwt = new Jwt();
    private final AuthRateLimit authRateLimit = new AuthRateLimit();
    private final RefreshCookie refreshCookie = new RefreshCookie();

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

    public AuthRateLimit getAuthRateLimit() {
        return authRateLimit;
    }

    public RefreshCookie getRefreshCookie() {
        return refreshCookie;
    }

    public static class AuthRateLimit {

        private boolean enabled = true;
        private Duration window = Duration.ofMinutes(1);
        private int loginMaxRequests = 10;
        private int refreshMaxRequests = 30;
        private int forgotPasswordMaxRequests = 5;

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }

        public Duration getWindow() {
            return window;
        }

        public void setWindow(Duration window) {
            this.window = window;
        }

        public int getLoginMaxRequests() {
            return loginMaxRequests;
        }

        public void setLoginMaxRequests(int loginMaxRequests) {
            this.loginMaxRequests = loginMaxRequests;
        }

        public int getRefreshMaxRequests() {
            return refreshMaxRequests;
        }

        public void setRefreshMaxRequests(int refreshMaxRequests) {
            this.refreshMaxRequests = refreshMaxRequests;
        }

        public int getForgotPasswordMaxRequests() {
            return forgotPasswordMaxRequests;
        }

        public void setForgotPasswordMaxRequests(int forgotPasswordMaxRequests) {
            this.forgotPasswordMaxRequests = forgotPasswordMaxRequests;
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

    public static class RefreshCookie {

        private String sameSite = "Lax";
        private String path = "/api/v1/auth";
        private Boolean secure;

        public String getSameSite() {
            return sameSite;
        }

        public void setSameSite(String sameSite) {
            this.sameSite = sameSite;
        }

        public String getPath() {
            return path;
        }

        public void setPath(String path) {
            this.path = path;
        }

        public Boolean getSecure() {
            return secure;
        }

        public void setSecure(Boolean secure) {
            this.secure = secure;
        }
    }
}
