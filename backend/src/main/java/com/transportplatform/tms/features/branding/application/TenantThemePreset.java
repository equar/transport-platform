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
        new TenantThemePreset("SLATE", "Slate", "Quiet slate navigation with a cool teal accent.", "#42556b", "#27313d", "#326d80"),
        new TenantThemePreset("OCEAN", "Ocean Blue", "A more premium blue palette for service-heavy workflows and dashboards.", "#0b5ea8", "#0d2545", "#35b4c4"),
        new TenantThemePreset("SUNSET", "Sunset Coral", "Warm, modern energy that works well for route and rider engagement pages.", "#c85c2d", "#6d2e22", "#f2af42"),
        new TenantThemePreset("MIDNIGHT", "Midnight Navy", "High-contrast, executive styling for operations and dispatch experiences.", "#1f2b4c", "#101827", "#5ec3b6"),
        new TenantThemePreset("EMERALD", "Emerald", "Fresh green tones that read as reliable, premium, and operationally clean.", "#1f7a62", "#143d2f", "#d4a53c"),
        new TenantThemePreset("AMBER", "Amber Bronze", "Grounded earth tones that feel approachable and service-focused.", "#8a5a22", "#4a2d1a", "#f0b429"),
        new TenantThemePreset("PLUM", "Plum", "A polished, modern alternative for premium tenant experiences and booking flows.", "#5d3a86", "#2f2149", "#f08a5d")
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
