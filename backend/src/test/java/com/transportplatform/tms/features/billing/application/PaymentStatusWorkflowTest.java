package com.transportplatform.tms.features.billing.application;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.features.billing.domain.Payment;
import com.transportplatform.tms.features.billing.domain.PaymentStatus;
import org.junit.jupiter.api.Test;

class PaymentStatusWorkflowTest {

    @Test
    void ensureCanApplyAllowsRecordedPayment() {
        Payment payment = payment(PaymentStatus.RECORDED);

        assertDoesNotThrow(() -> PaymentStatusWorkflow.ensureCanApply(payment));
    }

    @Test
    void ensureCanUpdateRejectsAppliedPayment() {
        Payment payment = payment(PaymentStatus.APPLIED);

        ApiException exception = assertThrows(ApiException.class,
                () -> PaymentStatusWorkflow.ensureCanUpdate(payment));

        assertEquals("INVALID_STATUS_TRANSITION", exception.getErrorCode().name());
    }

    @Test
    void ensureCanVoidRejectsVoidPayment() {
        Payment payment = payment(PaymentStatus.VOID);

        ApiException exception = assertThrows(ApiException.class,
                () -> PaymentStatusWorkflow.ensureCanVoid(payment));

        assertEquals("INVALID_STATUS_TRANSITION", exception.getErrorCode().name());
    }

    private Payment payment(PaymentStatus status) {
        Payment payment = new Payment();
        payment.setStatus(status);
        return payment;
    }
}