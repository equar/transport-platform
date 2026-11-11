package com.transportplatform.tms.features.companyapplication.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.auth.application.AuthFlowProperties;
import com.transportplatform.tms.features.auth.application.AuthSessionService;
import com.transportplatform.tms.common.security.PasswordEncoding;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.audit.application.AuditLogCommand;
import com.transportplatform.tms.features.auth.domain.AppUser;
import com.transportplatform.tms.features.auth.domain.AppUserRepository;
import com.transportplatform.tms.features.companyapplication.domain.CompanyApplication;
import com.transportplatform.tms.features.companyapplication.domain.CompanyApplicationRepository;
import com.transportplatform.tms.features.companyapplication.domain.CompanyApplicationStatus;
import com.transportplatform.tms.features.notification.application.NotificationDispatchService;
import com.transportplatform.tms.features.notification.domain.NotificationType;
import com.transportplatform.tms.features.tenant.domain.TenantRepository;
import com.transportplatform.tms.features.tenant.domain.TenantStatus;
import com.transportplatform.tms.features.tenant.application.TenantService;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TenantEmailVerificationService {
    private static final String RESEND_MESSAGE = "If your approved account needs verification, a new link will be emailed.";
    private final AppUserRepository users;
    private final CompanyApplicationRepository applications;
    private final TenantRepository tenants;
    private final NotificationDispatchService dispatch;
    private final AuthFlowProperties properties;
    private final Clock clock;
    private final PasswordEncoder passwordEncoder;
    private final AuthSessionService sessions;
    private final AuditLogService audit;
    private final TenantService tenantService;
    private final SecureRandom random = new SecureRandom();

    public TenantEmailVerificationService(AppUserRepository users, CompanyApplicationRepository applications,
            TenantRepository tenants, NotificationDispatchService dispatch, AuthFlowProperties properties, Clock clock,
            PasswordEncoder passwordEncoder, AuthSessionService sessions, AuditLogService audit,
            TenantService tenantService) {
        this.users = users;
        this.applications = applications;
        this.tenants = tenants;
        this.dispatch = dispatch;
        this.properties = properties;
        this.clock = clock;
        this.passwordEncoder = passwordEncoder;
        this.sessions = sessions;
        this.audit = audit;
        this.tenantService = tenantService;
    }

    @Transactional
    public void sendApprovalVerification(CompanyApplication application, AppUser owner) {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        owner.setEmailVerifiedAt(application.getEmailVerifiedAt());
        owner.setEmailVerificationEmail(owner.getEmail());
        owner.setEmailVerificationTokenHash(hash(token));
        owner.setEmailVerificationExpiresAt(clock.instant().plus(Duration.ofHours(24)));
        owner.setEmailVerificationRequestedAt(clock.instant());
        users.save(owner);
        String url = URI.create(properties.getPasswordResetBaseUrl()).resolve("/verify-email").toString()
                + "#token=" + token;
        String body = "Your company application " + application.getApplicationNumber() + " was approved.\n\n"
                + "Your application was reviewed and approved. Create your password to complete your account setup:\n"
                + url + "\n\nThis link expires in 24 hours and can be used once. "
                + "Creating your password completes onboarding and activates your approved workspace.";
        dispatch.notifyEmail(owner.getTenantId(), owner.getId(), owner.getEmail(),
                NotificationType.COMPANY_APPLICATION_APPROVED, "COMPANY_APPLICATION",
                application.getId().toString(), "Create your password - application approved",
                "Set up your tenant owner account", body,
                Map.of("applicationNumber", application.getApplicationNumber(), "companyName", application.getLegalCompanyName(),
                        "verificationUrl", url, "recipientEmail", owner.getEmail()));
    }

    @Transactional
    public String resend(String email) {
        var owner = users.findByEmailIgnoreCase(email.trim());
        if (owner.isEmpty() || !eligible(owner.get())) return RESEND_MESSAGE;
        AppUser user = owner.get();
        if (user.getEmailVerifiedAt() != null && !user.isMustChangePassword()
                && user.getEmail().equalsIgnoreCase(user.getEmailVerificationEmail())) {
            return RESEND_MESSAGE;
        }
        if (user.getEmailVerificationRequestedAt() != null
                && user.getEmailVerificationRequestedAt().plus(Duration.ofMinutes(5)).isAfter(clock.instant())) {
            return RESEND_MESSAGE;
        }
        applications.findFirstByApprovedTenantIdAndOwnerUserIdAndStatus(
                user.getTenantId(), user.getId(), CompanyApplicationStatus.APPROVED)
                .ifPresent(application -> sendApprovalVerification(application, user));
        return RESEND_MESSAGE;
    }

    @Transactional
    public String verify(String token, String password) {
        AppUser owner = users.findByEmailVerificationTokenHash(hash(token)).orElseThrow(this::invalidLink);
        if (!eligible(owner) || owner.getEmailVerificationExpiresAt() == null
                || !owner.getEmailVerificationExpiresAt().isAfter(clock.instant())
                || !owner.getEmail().equalsIgnoreCase(owner.getEmailVerificationEmail())) {
            throw invalidLink();
        }
        if (password == null || password.isBlank() || password.length() < 8 || password.length() > 100) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST,
                    "Use a password between 8 and 100 characters.");
        }
        owner.setPasswordHash(PasswordEncoding.encode(passwordEncoder, password));
        owner.setPasswordChangedAt(clock.instant());
        owner.setMustChangePassword(false);
        owner.setTemporaryPasswordExpiresAt(null);
        owner.setPasswordResetTokenHash(null);
        owner.setPasswordResetTokenExpiresAt(null);
        owner.setPasswordResetRequestedAt(null);
        owner.setEmailVerifiedAt(clock.instant());
        owner.setEmailVerificationTokenHash(null);
        owner.setEmailVerificationExpiresAt(null);
        users.save(owner);
        activateCompletedOwner(owner);
        sessions.revokeAllForUser(owner.getId());
        audit.record(new AuditLogCommand(null, owner.getTenantId(), "AUTH", "TENANT_OWNER_SETUP_COMPLETED",
                "USER", owner.getId().toString(), "Tenant owner verified their email and created a password.",
                null, Map.of("userId", owner.getId())));
        return "Your password is created and your approved workspace is active. You can now sign in.";
    }

    @Transactional
    public void activateCompletedOwner(AppUser owner) {
        if (owner.getTenantId() == null || !owner.isActiveForLogin() || owner.isMustChangePassword()
                || owner.getPasswordChangedAt() == null || owner.getEmailVerifiedAt() == null
                || !owner.getEmail().equalsIgnoreCase(owner.getEmailVerificationEmail())
                || !applications.existsByApprovedTenantIdAndOwnerUserIdAndStatus(
                    owner.getTenantId(), owner.getId(), CompanyApplicationStatus.APPROVED)) return;
        var tenant = tenants.lockForDispatch(owner.getTenantId()).orElseThrow(this::invalidLink);
        if (tenant.getStatus() == TenantStatus.PENDING) {
            tenantService.activate(owner.getTenantId());
        }
    }

    private boolean eligible(AppUser owner) {
        if (owner.getTenantId() == null || !owner.isActiveForLogin()) return false;
        var status = tenants.findById(owner.getTenantId()).map(tenant -> tenant.getStatus()).orElse(null);
        return (status == TenantStatus.PENDING || status == TenantStatus.ACTIVE)
                && applications.existsByApprovedTenantIdAndOwnerUserIdAndStatus(
                        owner.getTenantId(), owner.getId(), CompanyApplicationStatus.APPROVED);
    }

    private String hash(String token) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is required for email verification.", exception);
        }
    }

    private ApiException invalidLink() {
        return new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST,
                "This verification link is invalid or expired. Request a new verification email.");
    }
}
