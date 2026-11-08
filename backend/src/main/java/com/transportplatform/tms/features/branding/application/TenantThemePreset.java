package com.transportplatform.tms.features.branding.application;

import java.util.Arrays;
import java.util.List;
import com.transportplatform.tms.features.settings.domain.TenantSettings;

public record TenantThemePreset(String code, String name, String description,
        String primaryColor, String secondaryColor, String accentColor) {
    public static final List<TenantThemePreset> ALL = List.of(
        new TenantThemePreset("DEFAULT", "Classic Blue", "The original Bakaroo look: dependable blue and navy.", "#214e82", "#12263e", "#d8662a"),
        new TenantThemePreset("HARBOR", "Harbor Teal", "Calm teal navigation with warm copper accents.", "#006b68", "#103c40", "#b66324"),
        new TenantThemePreset("FOREST", "Forest Green", "Grounded greens with a warm gold accent.", "#276442", "#173c2b", "#8b641c"),
        new TenantThemePreset("INDIGO", "Indigo", "Confident violet-blue with a terracotta accent.", "#5341a1", "#2d2354", "#a84e32"),
        new TenantThemePreset("BURGUNDY", "Burgundy", "Rich wine tones with understated brass accents.", "#8c354a", "#492333", "#84621c"),
        new TenantThemePreset("SLATE", "Slate", "Quiet slate navigation with a cool teal accent.", "#42556b", "#27313d", "#326d80")
    );

    public static String selectedCode(TenantSettings settings) {
        if (settings == null || Arrays.asList(settings.getPrimaryColor(), settings.getSecondaryColor(), settings.getAccentColor())
                .stream().allMatch(value -> value == null || value.isBlank())) return "DEFAULT";
        return ALL.stream().filter(theme -> theme.primaryColor.equalsIgnoreCase(orEmpty(settings.getPrimaryColor()))
                && theme.secondaryColor.equalsIgnoreCase(orEmpty(settings.getSecondaryColor()))
                && theme.accentColor.equalsIgnoreCase(orEmpty(settings.getAccentColor())))
                .map(TenantThemePreset::code).findFirst().orElse("CUSTOM");
    }
    private static String orEmpty(String value) { return value == null ? "" : value; }
}
