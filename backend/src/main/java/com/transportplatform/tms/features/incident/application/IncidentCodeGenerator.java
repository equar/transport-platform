package com.transportplatform.tms.features.incident.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.incident.domain.IncidentRepository;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class IncidentCodeGenerator {

    private final IncidentRepository incidentRepository;

    public IncidentCodeGenerator(IncidentRepository incidentRepository) {
        this.incidentRepository = incidentRepository;
    }

    public String generate(String tenantId) {
        for (int attempt = 0; attempt < 10; attempt++) {
            String code = "INC-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
            if (!incidentRepository.existsByTenantIdAndIncidentCodeIgnoreCase(tenantId, code)) {
                return code;
            }
        }
        throw new ApiException(
                ErrorCode.INTERNAL_SERVER_ERROR,
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Incident code generation failed.");
    }
}