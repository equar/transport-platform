package com.transportplatform.tms.features.runtime.api.response;

public record RuntimeBrandingResponse(
        String displayName,
        String logoUrl,
        String faviconUrl,
        String primaryColor,
        String secondaryColor,
        String accentColor,
        String supportEmail,
        String supportPhone,
        String website,
        String customLoginWelcomeText,
        String customFooterText) {
}