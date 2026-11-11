package com.transportplatform.tms.features.companyapplication.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.auth.application.AuthFlowProperties;
import com.transportplatform.tms.features.companyapplication.domain.*;
import com.transportplatform.tms.features.notification.application.NotificationEmailSender;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.util.Base64;
import java.util.HexFormat;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ApplicationEmailVerificationService {
    private final CompanyApplicationRepository applications;
    private final CompanyApplicationReviewEventRepository events;
    private final NotificationEmailSender sender;
    private final AuthFlowProperties properties;
    private final Clock clock;
    private final SecureRandom random = new SecureRandom();

    public ApplicationEmailVerificationService(CompanyApplicationRepository applications,
            CompanyApplicationReviewEventRepository events, NotificationEmailSender sender,
            AuthFlowProperties properties, Clock clock) {
        this.applications = applications;
        this.events = events;
        this.sender = sender;
        this.properties = properties;
        this.clock = clock;
    }

    @Transactional
    public void sendVerification(CompanyApplication application) {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        application.setVerificationTokenHash(hash(token));
        application.setVerificationExpiresAt(clock.instant().plus(Duration.ofHours(24)));
        application.setVerificationRequestedAt(clock.instant());
        applications.save(application);
        String url = URI.create(properties.getPasswordResetBaseUrl()).resolve("/verify-application-email") + "#token=" + token;
        var delivery = sender.send(new NotificationEmailSender.NotificationEmailCommand(application.getEmail(),
                "Verify your application email", "Verify your application email",
                "Your application " + application.getApplicationNumber() + " has been received.\n\n"
                + "Confirm your email to make the application ready for administrator review:\n" + url
                + "\n\nThis single-use link expires in 24 hours. No password is required yet. "
                + "After approval, a separate email will let you create your password."));
        if (!delivery.sent()) {
            throw new ApiException(ErrorCode.INTERNAL_SERVER_ERROR, HttpStatus.SERVICE_UNAVAILABLE,
                    "The verification email could not be sent. Please try again.");
        }
    }

    @Transactional
    public String verify(String token) {
        CompanyApplication application = applications.findByVerificationTokenHash(hash(token))
                .orElseThrow(this::invalidLink);
        if (application.getStatus() != CompanyApplicationStatus.PENDING_EMAIL_VERIFICATION
                || application.getVerificationExpiresAt() == null
                || !application.getVerificationExpiresAt().isAfter(clock.instant())) throw invalidLink();
        application.setEmailVerifiedAt(clock.instant());
        application.setVerificationTokenHash(null);
        application.setVerificationExpiresAt(null);
        application.setStatus(CompanyApplicationStatus.SUBMITTED);
        applications.save(application);
        var event = new CompanyApplicationReviewEvent();
        event.setCompanyApplicationId(application.getId());
        event.setAction(CompanyApplicationReviewAction.EMAIL_VERIFIED);
        event.setFromStatus(CompanyApplicationStatus.PENDING_EMAIL_VERIFICATION);
        event.setToStatus(CompanyApplicationStatus.SUBMITTED);
        event.setNotes("Application email verified; ready for administrator review.");
        events.save(event);
        return "Your email is verified. Your application is now ready for administrator review. After approval, you will receive a link to create your password.";
    }

    @Transactional
    public String resend(String applicationNumber) {
        applications.findByApplicationNumber(applicationNumber.trim()).filter(application ->
                application.getStatus() == CompanyApplicationStatus.PENDING_EMAIL_VERIFICATION
                && (application.getVerificationRequestedAt() == null
                    || !application.getVerificationRequestedAt().plus(Duration.ofMinutes(5)).isAfter(clock.instant())))
                .ifPresent(this::sendVerification);
        return "If your application needs email verification, a new link will be sent to its email address.";
    }

    private String hash(String token) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException error) {
            throw new IllegalStateException("SHA-256 is required for email verification.", error);
        }
    }

    private ApiException invalidLink() {
        return new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST,
                "This application verification link is invalid or expired. Request a new link using your application reference.");
    }
}
