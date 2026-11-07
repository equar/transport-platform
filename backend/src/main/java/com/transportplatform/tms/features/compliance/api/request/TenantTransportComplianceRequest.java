package com.transportplatform.tms.features.compliance.api.request;

import com.transportplatform.tms.features.compliance.domain.TransportOperatingScope;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record TenantTransportComplianceRequest(
        @NotNull TransportOperatingScope operatingScope,
        @NotBlank @Pattern(regexp = "^[A-Z]{2}$") String primaryState,
        @Size(max = 80) String operatingAuthorityType,
        @Size(max = 120) String operatingAuthorityNumber,
        LocalDate operatingAuthorityExpiresOn,
        boolean insuranceVerified,
        LocalDate insuranceExpiresOn,
        boolean studentSafeguardingPolicyVerified,
        boolean ferpaDataAgreementVerified,
        boolean employeeTransportConsentPolicyVerified,
        boolean accessibilityPolicyVerified) {}

