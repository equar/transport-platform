package com.transportplatform.tms.features.vehicle.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.vehicle.domain.VehicleRepository;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class VehicleCodeGenerator {

    private final VehicleRepository vehicleRepository;

    public VehicleCodeGenerator(VehicleRepository vehicleRepository) {
        this.vehicleRepository = vehicleRepository;
    }

    public String generate(String tenantId) {
        for (int attempt = 0; attempt < 10; attempt++) {
            String code = "VEH-" + UUID.randomUUID().toString().replace("-", "")
                    .substring(0, 8)
                    .toUpperCase();
            if (!vehicleRepository.existsByTenantIdAndVehicleCodeIgnoreCase(tenantId, code)) {
                return code;
            }
        }
        throw new ApiException(
                ErrorCode.INTERNAL_SERVER_ERROR,
                HttpStatus.INTERNAL_SERVER_ERROR,
                "A unique vehicle code could not be generated.");
    }
}