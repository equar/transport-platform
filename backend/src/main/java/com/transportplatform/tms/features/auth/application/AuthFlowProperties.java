package com.transportplatform.tms.features.auth.application;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.auth")
public class AuthFlowProperties {

    private String passwordResetBaseUrl = "http://localhost:3007/reset-password";
    private Duration passwordResetTtl = Duration.ofHours(2);

    public String getPasswordResetBaseUrl() {
        return passwordResetBaseUrl;
    }

    public void setPasswordResetBaseUrl(String passwordResetBaseUrl) {
        this.passwordResetBaseUrl = passwordResetBaseUrl;
    }

    public Duration getPasswordResetTtl() {
        return passwordResetTtl;
    }

    public void setPasswordResetTtl(Duration passwordResetTtl) {
        this.passwordResetTtl = passwordResetTtl;
    }
}
