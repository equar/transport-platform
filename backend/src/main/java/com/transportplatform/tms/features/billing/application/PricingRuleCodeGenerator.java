package com.transportplatform.tms.features.billing.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.billing.domain.PricingRuleRepository;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class PricingRuleCodeGenerator {
    @org.springframework.beans.factory.annotation.Autowired
    private com.transportplatform.tms.features.settings.domain.TenantSettingsRepository numberingSettings;

    private final PricingRuleRepository pricingRuleRepository;

    public PricingRuleCodeGenerator(PricingRuleRepository pricingRuleRepository) {
        this.pricingRuleRepository = pricingRuleRepository;
    }

    public String generate(String tenantId) {
        for (int attempt = 0; attempt < 10; attempt++) {
            String code = numberingSettings.findById(tenantId).map(settings -> settings.getPricingRulePrefix()).orElse("PRC") + "-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
            if (!pricingRuleRepository.existsByTenantIdAndPricingRuleCodeIgnoreCase(tenantId, code)) {
                return code;
            }
        }
        throw new ApiException(
                ErrorCode.INTERNAL_SERVER_ERROR,
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Pricing rule code generation failed.");
    }
}
