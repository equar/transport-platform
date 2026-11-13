package com.transportplatform.tms.features.billing.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.billing.domain.InvoiceRepository;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class InvoiceNumberGenerator {
    @org.springframework.beans.factory.annotation.Autowired
    private com.transportplatform.tms.features.settings.domain.TenantSettingsRepository numberingSettings;

    private final InvoiceRepository invoiceRepository;

    public InvoiceNumberGenerator(InvoiceRepository invoiceRepository) {
        this.invoiceRepository = invoiceRepository;
    }

    public String generate(String tenantId) {
        for (int attempt = 0; attempt < 10; attempt++) {
            String number = numberingSettings.findById(tenantId).map(settings -> settings.getInvoicePrefix()).orElse("INV") + "-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
            if (!invoiceRepository.existsByTenantIdAndInvoiceNumberIgnoreCase(tenantId, number)) {
                return number;
            }
        }
        throw new ApiException(
                ErrorCode.INTERNAL_SERVER_ERROR,
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Invoice number generation failed.");
    }
}
