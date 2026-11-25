package com.transportplatform.tms.features.billing.application;

import com.transportplatform.tms.common.exception.*;
import com.transportplatform.tms.features.billing.domain.*;
import com.transportplatform.tms.features.settings.application.CompanySettingsService;
import com.transportplatform.tms.features.settings.domain.*;
import java.math.*;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/** Shared tenant policy for every invoice creation path. Applied values are invoice snapshots. */
@Service
public class InvoicePolicyService {
    private final TenantSettingsRepository settings;
    public InvoicePolicyService(TenantSettingsRepository settings) { this.settings = settings; }
    public TenantSettings settings(String tenant) {
        return settings.findById(tenant).orElseGet(() -> CompanySettingsService.defaultSettings(tenant));
    }
    public void apply(Invoice invoice, List<InvoiceLineItem> lines, boolean automatic) {
        var policy = settings(invoice.getTenantId());
        if (automatic || !policy.isAllowManualInvoiceOverrides()) {
            var subtotal = lines.stream().map(line -> line.getLineAmount().setScale(2, RoundingMode.HALF_UP))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            invoice.setTaxAmount(policy.isTaxEnabled() ? subtotal.multiply(policy.getDefaultTaxRate())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO);
            if (invoice.getDiscountAmount() != null && invoice.getDiscountAmount().signum() != 0)
                throw new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST,
                        "Manual discounts require invoice override permission in company settings.");
        }
    }
}
