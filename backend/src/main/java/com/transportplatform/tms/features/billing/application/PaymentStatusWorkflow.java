package com.transportplatform.tms.features.billing.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.billing.domain.Payment;
import com.transportplatform.tms.features.billing.domain.PaymentStatus;
import org.springframework.http.HttpStatus;

public final class PaymentStatusWorkflow {

    private PaymentStatusWorkflow() {
    }

    public static void ensureCanUpdate(Payment payment) {
        if (payment.getStatus() != PaymentStatus.RECORDED && payment.getStatus() != PaymentStatus.FAILED) {
            throw invalidTransition("Only recorded or failed payments can be updated.");
        }
    }

    public static void ensureCanApply(Payment payment) {
        if (payment.getStatus() != PaymentStatus.RECORDED) {
            throw invalidTransition("Only recorded payments can be applied.");
        }
    }

    public static void ensureCanVoid(Payment payment) {
        if (payment.getStatus() == PaymentStatus.VOID || payment.getStatus() == PaymentStatus.FAILED) {
            throw invalidTransition("Only recorded or applied payments can be voided.");
        }
    }

    private static ApiException invalidTransition(String message) {
        return new ApiException(ErrorCode.INVALID_STATUS_TRANSITION, HttpStatus.BAD_REQUEST, message);
    }
}