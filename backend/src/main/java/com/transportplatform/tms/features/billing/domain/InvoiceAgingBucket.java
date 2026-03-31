package com.transportplatform.tms.features.billing.domain;

public enum InvoiceAgingBucket {
    CURRENT,
    DAYS_1_TO_30,
    DAYS_31_TO_60,
    DAYS_61_TO_90,
    DAYS_90_PLUS
}