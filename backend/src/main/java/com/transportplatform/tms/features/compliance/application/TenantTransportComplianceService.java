package com.transportplatform.tms.features.compliance.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.compliance.api.request.TenantTransportComplianceRequest;
import com.transportplatform.tms.features.compliance.api.request.TransportComplianceDecisionRequest;
import com.transportplatform.tms.features.compliance.api.response.TenantTransportComplianceResponse;
import com.transportplatform.tms.features.compliance.domain.TenantTransportCompliance;
import com.transportplatform.tms.features.compliance.domain.TenantTransportComplianceRepository;
import com.transportplatform.tms.features.compliance.domain.TransportVerificationStatus;
import com.transportplatform.tms.features.tenant.domain.TenantRepository;
import java.time.Clock;
import java.time.LocalDate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TenantTransportComplianceService {
    private final TenantTransportComplianceRepository repository;
    private final TenantRepository tenantRepository;
    private final CurrentAuthenticatedUserService currentUserService;
    private final Clock clock;

    public TenantTransportComplianceService(TenantTransportComplianceRepository repository,
            TenantRepository tenantRepository, CurrentAuthenticatedUserService currentUserService, Clock clock) {
        this.repository = repository;
        this.tenantRepository = tenantRepository;
        this.currentUserService = currentUserService;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public TenantTransportComplianceResponse getCurrentTenantProfile() {
        return toResponse(repository.findById(requireTenantAdmin().tenantId()).orElse(null));
    }

    @Transactional
    public TenantTransportComplianceResponse attest(TenantTransportComplianceRequest request) {
        AuthenticatedUser user = requireTenantAdmin();
        validateAttestation(request);
        TenantTransportCompliance profile = repository.findById(user.tenantId()).orElseGet(TenantTransportCompliance::new);
        profile.setTenantId(user.tenantId());
        profile.setOperatingScope(request.operatingScope());
        profile.setPrimaryState(request.primaryState());
        profile.setOperatingAuthorityType(trim(request.operatingAuthorityType()));
        profile.setOperatingAuthorityNumber(trim(request.operatingAuthorityNumber()));
        profile.setOperatingAuthorityExpiresOn(request.operatingAuthorityExpiresOn());
        profile.setInsuranceVerified(request.insuranceVerified());
        profile.setInsuranceExpiresOn(request.insuranceExpiresOn());
        profile.setStudentSafeguardingPolicyVerified(request.studentSafeguardingPolicyVerified());
        profile.setFerpaDataAgreementVerified(request.ferpaDataAgreementVerified());
        profile.setEmployeeTransportConsentPolicyVerified(request.employeeTransportConsentPolicyVerified());
        profile.setAccessibilityPolicyVerified(request.accessibilityPolicyVerified());
        profile.setAttestedBy(user.displayName());
        profile.setAttestedAt(clock.instant());
        profile.setVerifiedBy(null);
        profile.setVerifiedAt(null);
        profile.setVerificationNotes(null);
        profile.setVerificationStatus(TransportVerificationStatus.PENDING_REVIEW);
        return toResponse(repository.save(profile));
    }

    @Transactional(readOnly = true)
    public TenantTransportComplianceResponse getForPlatform(String tenantId) {
        requirePlatformAdmin();
        requireTenant(tenantId);
        return toResponse(repository.findById(tenantId).orElse(null));
    }

    @Transactional
    public TenantTransportComplianceResponse decide(String tenantId, TransportComplianceDecisionRequest request) {
        AuthenticatedUser user = requirePlatformAdmin();
        TenantTransportCompliance profile = repository.findById(tenantId)
                .orElseThrow(() -> notFound("The tenant has not submitted a transport compliance profile."));
        if (profile.getVerificationStatus() != TransportVerificationStatus.PENDING_REVIEW) {
            throw validation("Only a pending compliance profile can be reviewed.");
        }
        profile.setVerificationStatus(request.approved()
                ? TransportVerificationStatus.VERIFIED : TransportVerificationStatus.REJECTED);
        profile.setVerifiedBy(user.displayName());
        profile.setVerifiedAt(clock.instant());
        profile.setVerificationNotes(trim(request.notes()));
        return toResponse(repository.save(profile));
    }

    public boolean isDispatchApproved(String tenantId) {
        LocalDate today = LocalDate.now(clock);
        return repository.findById(tenantId).filter(profile ->
                profile.getVerificationStatus() == TransportVerificationStatus.VERIFIED
                && profile.isInsuranceVerified()
                && profile.getInsuranceExpiresOn() != null && !profile.getInsuranceExpiresOn().isBefore(today)
                && (profile.getOperatingAuthorityExpiresOn() == null
                    || !profile.getOperatingAuthorityExpiresOn().isBefore(today)))
                .isPresent();
    }

    private void validateAttestation(TenantTransportComplianceRequest request) {
        LocalDate today = LocalDate.now(clock);
        if (!request.insuranceVerified() || request.insuranceExpiresOn() == null
                || request.insuranceExpiresOn().isBefore(today)) throw validation("Current insurance verification is required.");
        if (!request.studentSafeguardingPolicyVerified() || !request.ferpaDataAgreementVerified()
                || !request.employeeTransportConsentPolicyVerified() || !request.accessibilityPolicyVerified()) {
            throw validation("Safeguarding, FERPA, employee consent, and accessibility policies must be attested.");
        }
        if (request.operatingAuthorityExpiresOn() != null && request.operatingAuthorityExpiresOn().isBefore(today)) {
            throw validation("Operating authority cannot be expired.");
        }
    }

    private AuthenticatedUser requireTenantAdmin() {
        AuthenticatedUser user = currentUserService.requireCurrentUser();
        if (user.tenantId() == null || user.getAuthorities().stream().noneMatch(a ->
                a.getAuthority().equals(RoleName.ROLE_TENANT_ADMIN.name()))) throw forbidden();
        return user;
    }

    private AuthenticatedUser requirePlatformAdmin() {
        AuthenticatedUser user = currentUserService.requireCurrentUser();
        if (user.getAuthorities().stream().noneMatch(a ->
                a.getAuthority().equals(RoleName.ROLE_PLATFORM_ADMIN.name()))) throw forbidden();
        return user;
    }

    private void requireTenant(String tenantId) { if (!tenantRepository.existsById(tenantId)) throw notFound("Tenant was not found."); }
    private String trim(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private ApiException forbidden() { return new ApiException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN, "Administrator access is required."); }
    private ApiException validation(String message) { return new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST, message); }
    private ApiException notFound(String message) { return new ApiException(ErrorCode.RESOURCE_NOT_FOUND, HttpStatus.NOT_FOUND, message); }

    private TenantTransportComplianceResponse toResponse(TenantTransportCompliance p) {
        if (p == null) return null;
        return new TenantTransportComplianceResponse(p.getTenantId(), p.getOperatingScope(), p.getVerificationStatus(),
                p.getPrimaryState(), p.getOperatingAuthorityType(), p.getOperatingAuthorityNumber(),
                p.getOperatingAuthorityExpiresOn(), p.isInsuranceVerified(), p.getInsuranceExpiresOn(),
                p.isStudentSafeguardingPolicyVerified(), p.isFerpaDataAgreementVerified(),
                p.isEmployeeTransportConsentPolicyVerified(), p.isAccessibilityPolicyVerified(), p.getAttestedBy(),
                p.getAttestedAt(), p.getVerifiedBy(), p.getVerifiedAt(), p.getVerificationNotes());
    }
}

