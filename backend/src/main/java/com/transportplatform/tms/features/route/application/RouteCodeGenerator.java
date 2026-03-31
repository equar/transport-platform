package com.transportplatform.tms.features.route.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.route.domain.RouteRepository;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class RouteCodeGenerator {

    private final RouteRepository routeRepository;

    public RouteCodeGenerator(RouteRepository routeRepository) {
        this.routeRepository = routeRepository;
    }

    public String generate(String tenantId) {
        for (int attempt = 0; attempt < 10; attempt++) {
            String code = "ROUTE-" + UUID.randomUUID().toString().replace("-", "")
                    .substring(0, 8)
                    .toUpperCase();
            if (!routeRepository.existsByTenantIdAndRouteCodeIgnoreCase(tenantId, code)) {
                return code;
            }
        }
        throw new ApiException(
                ErrorCode.INTERNAL_SERVER_ERROR,
                HttpStatus.INTERNAL_SERVER_ERROR,
                "A unique route code could not be generated.");
    }
}