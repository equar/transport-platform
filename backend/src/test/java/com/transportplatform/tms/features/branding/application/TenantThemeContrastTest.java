package com.transportplatform.tms.features.branding.application;
import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;
class TenantThemeContrastTest {
    @Test void everyPresetSupportsWhiteTextOnItsPrimaryAndNavigationColors() {
        assertEquals(6, TenantThemePreset.ALL.size());
        for (var theme : TenantThemePreset.ALL) {
            assertTrue(contrastWithWhite(theme.primaryColor()) >= 4.5, theme.name() + " primary contrast");
            assertTrue(contrastWithWhite(theme.secondaryColor()) >= 4.5, theme.name() + " navigation contrast");
        }
    }
    private double contrastWithWhite(String hex) {
        double[] weights = {.2126, .7152, .0722}; double luminance = 0;
        for (int channel = 0; channel < 3; channel++) {
            double value = Integer.parseInt(hex.substring(1 + channel * 2, 3 + channel * 2), 16) / 255.0;
            luminance += weights[channel] * (value <= .04045 ? value / 12.92 : Math.pow((value + .055) / 1.055, 2.4));
        }
        return 1.05 / (luminance + .05);
    }
}
