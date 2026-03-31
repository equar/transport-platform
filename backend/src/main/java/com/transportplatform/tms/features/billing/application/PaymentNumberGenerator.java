package com.transportplatform.tms.features.billing.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.billing.domain.PaymentRepository;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class PaymentNumberGenerator {

    private final PaymentRepository paymentRepository;

    public PaymentNumberGenerator(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    public String generate(String tenantId) {
        for (int attempt = 0; attempt < 10; attempt++) {
            String number = "PAY-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
            if (!paymentRepository.existsByTenantIdAndPaymentNumberIgnoreCase(tenantId, number)) {
                return number;
            }
        }
        throw new ApiException(
                ErrorCode.INTERNAL_SERVER_ERROR,
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Payment number generation failed.");
    }
}