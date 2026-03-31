package com.transportplatform.tms.features.rider.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.rider.domain.RiderRepository;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class RiderCodeGenerator {

    private final RiderRepository riderRepository;

    public RiderCodeGenerator(RiderRepository riderRepository) {
        this.riderRepository = riderRepository;
    }

    public String generate(String tenantId) {
        for (int attempt = 0; attempt < 10; attempt++) {
            String code = "RID-" + UUID.randomUUID().toString().replace("-", "")
                    .substring(0, 8)
                    .toUpperCase();
            if (!riderRepository.existsByTenantIdAndRiderCodeIgnoreCase(tenantId, code)) {
                return code;
            }
        }
        throw new ApiException(
                ErrorCode.INTERNAL_SERVER_ERROR,
                HttpStatus.INTERNAL_SERVER_ERROR,
                "A unique rider code could not be generated.");
    }
}