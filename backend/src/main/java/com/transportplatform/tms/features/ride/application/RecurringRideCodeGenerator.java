package com.transportplatform.tms.features.ride.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.ride.domain.RecurringRideScheduleRepository;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class RecurringRideCodeGenerator {

    private final RecurringRideScheduleRepository recurringRideScheduleRepository;

    public RecurringRideCodeGenerator(RecurringRideScheduleRepository recurringRideScheduleRepository) {
        this.recurringRideScheduleRepository = recurringRideScheduleRepository;
    }

    public String generate(String tenantId) {
        for (int attempt = 0; attempt < 10; attempt++) {
            String code = "RCR-" + UUID.randomUUID().toString().replace("-", "")
                    .substring(0, 8)
                    .toUpperCase();
            if (!recurringRideScheduleRepository.existsByTenantIdAndRecurrenceCodeIgnoreCase(tenantId, code)) {
                return code;
            }
        }
        throw new ApiException(
                ErrorCode.INTERNAL_SERVER_ERROR,
                HttpStatus.INTERNAL_SERVER_ERROR,
                "A unique recurring ride code could not be generated.");
    }
}