package com.transportplatform.tms.features.companyapplication.application;

import com.transportplatform.tms.features.tenant.domain.TenantRepository;
import java.text.Normalizer;
import java.util.Locale;
import org.springframework.stereotype.Component;

@Component
public class TenantCodeGenerator {

    private final TenantRepository tenantRepository;

    public TenantCodeGenerator(TenantRepository tenantRepository) {
        this.tenantRepository = tenantRepository;
    }

    public String generate(String sourceValue, String requestedCode) {
        String baseCode = requestedCode != null && !requestedCode.isBlank()
                ? sanitize(requestedCode)
                : sanitize(sourceValue);

        String candidate = baseCode;
        int sequence = 1;
        while (tenantRepository.existsByTenantCodeIgnoreCase(candidate)) {
            candidate = baseCode + "-" + sequence++;
        }
        return candidate;
    }

    private String sanitize(String rawValue) {
        String normalized = Normalizer.normalize(rawValue, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replaceAll("[^A-Za-z0-9]+", "-")
                .replaceAll("^-+|-+$", "")
                .toUpperCase(Locale.ROOT);
        return normalized.length() > 50 ? normalized.substring(0, 50) : normalized;
    }
}
