package com.transportplatform.tms.features.organization.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.organization.domain.ContractRepository;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class ContractCodeGenerator {

    private final ContractRepository contractRepository;

    public ContractCodeGenerator(ContractRepository contractRepository) {
        this.contractRepository = contractRepository;
    }

    public String generate(String tenantId) {
        for (int attempt = 0; attempt < 10; attempt++) {
            String code = "CTR-" + UUID.randomUUID().toString().replace("-", "")
                    .substring(0, 8)
                    .toUpperCase();
            if (!contractRepository.existsByTenantIdAndContractCodeIgnoreCase(tenantId, code)) {
                return code;
            }
        }
        throw new ApiException(
                ErrorCode.INTERNAL_SERVER_ERROR,
                HttpStatus.INTERNAL_SERVER_ERROR,
                "A unique contract code could not be generated.");
    }
}