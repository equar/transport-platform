package com.transportplatform.tms.features.billing.api.response;

import com.transportplatform.tms.features.billing.domain.InvoiceAgingBucket;
import java.math.BigDecimal;

public record AgingBucketSummaryResponse(
        InvoiceAgingBucket bucket,
        long invoiceCount,
        BigDecimal amount) {
}