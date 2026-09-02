package com.transportplatform.tms.features.compliance.api.response;

import com.transportplatform.tms.features.compliance.domain.TransportOperatingScope;
import com.transportplatform.tms.features.compliance.domain.TransportVerificationStatus;
import java.time.Instant;
import java.time.LocalDate;

public record TenantTransportComplianceResponse(String tenantId, TransportOperatingScope operatingScope,
        TransportVerificationStatus verificationStatus, String primaryState, String operatingAuthorityType,
        String operatingAuthorityNumber, LocalDate operatingAuthorityExpiresOn, boolean insuranceVerified,
        LocalDate insuranceExpiresOn, boolean studentSafeguardingPolicyVerified, boolean ferpaDataAgreementVerified,
        boolean employeeTransportConsentPolicyVerified, boolean accessibilityPolicyVerified, String attestedBy,
        Instant attestedAt, String verifiedBy, Instant verifiedAt, String verificationNotes) {}
