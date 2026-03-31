package com.transportplatform.tms.features.saas.application;

import com.transportplatform.tms.features.saas.domain.FeatureFlagRepository;
import java.text.Normalizer;
import java.util.Locale;
import org.springframework.stereotype.Component;

@Component
public class FeatureFlagCodeGenerator {

    private final FeatureFlagRepository featureFlagRepository;

    public FeatureFlagCodeGenerator(FeatureFlagRepository featureFlagRepository) {
        this.featureFlagRepository = featureFlagRepository;
    }

    public String generate(String sourceValue, String requestedCode) {
        String baseCode = requestedCode != null && !requestedCode.isBlank()
                ? normalize(requestedCode)
                : normalize(sourceValue);
        String candidate = baseCode;
        int sequence = 1;
        while (featureFlagRepository.existsByFlagCodeIgnoreCase(candidate)) {
            candidate = baseCode + "-" + sequence++;
        }
        return candidate;
    }

    public String normalize(String rawValue) {
        String normalized = Normalizer.normalize(rawValue, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replaceAll("[^A-Za-z0-9]+", "-")
                .replaceAll("^-+|-+$", "")
                .toUpperCase(Locale.ROOT);
        String candidate = normalized.isBlank() ? "FEATURE" : normalized;
        return candidate.length() > 50 ? candidate.substring(0, 50) : candidate;
    }
}