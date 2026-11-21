package com.transportplatform.tms.features.billing.domain;

public enum PaymentStatus {
    RECORDED,
    APPLIED,
    PARTIALLY_APPLIED,
    PARTIALLY_REFUNDED,
    REFUNDED,
    VOID,
    FAILED
}