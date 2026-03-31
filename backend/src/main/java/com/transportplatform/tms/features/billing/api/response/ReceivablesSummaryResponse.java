package com.transportplatform.tms.features.billing.api.response;

import java.math.BigDecimal;
import java.util.List;

public record ReceivablesSummaryResponse(
        long totalPaymentsRecorded,
        BigDecimal totalCollectedAmount,
        BigDecimal outstandingBalance,
        long overdueInvoiceCount,
        BigDecimal overdueAmount,
        long partiallyPaidInvoiceCount,
        List<AgingBucketSummaryResponse> agingBuckets) {
}