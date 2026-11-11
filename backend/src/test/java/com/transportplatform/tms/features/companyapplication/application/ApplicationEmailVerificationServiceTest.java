package com.transportplatform.tms.features.companyapplication.application;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.features.auth.application.AuthFlowProperties;
import com.transportplatform.tms.features.companyapplication.domain.*;
import com.transportplatform.tms.features.notification.application.NotificationEmailSender;
import java.time.*;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

class ApplicationEmailVerificationServiceTest {
    private final CompanyApplicationRepository applications = mock(CompanyApplicationRepository.class);
    private final CompanyApplicationReviewEventRepository events = mock(CompanyApplicationReviewEventRepository.class);
    private final NotificationEmailSender sender = mock(NotificationEmailSender.class);
    private final Instant now = Instant.parse("2026-11-11T06:00:00Z");
    private final CompanyApplication application = new CompanyApplication();
    private ApplicationEmailVerificationService service;

    @BeforeEach void setup() {
        var properties = new AuthFlowProperties();
        properties.setPasswordResetBaseUrl("https://admin.transport.bakaroo.com/reset-password");
        service = new ApplicationEmailVerificationService(applications, events, sender, properties, Clock.fixed(now, ZoneOffset.UTC));
        ReflectionTestUtils.setField(application, "id", 1L);
        application.setEmail("applicant@example.test");
        application.setApplicationNumber("APP-1");
        application.setStatus(CompanyApplicationStatus.PENDING_EMAIL_VERIFICATION);
    }

    @Test void submissionSendsVerificationBeforeReviewWithoutCreatingAPassword() {
        when(sender.send(any())).thenReturn(new NotificationEmailSender.DeliveryResult(true, null));
        service.sendVerification(application);
        assertThat(application.getVerificationTokenHash()).hasSize(64);
        assertThat(application.getVerificationExpiresAt()).isEqualTo(now.plus(Duration.ofHours(24)));
        assertThat(application.getStatus()).isEqualTo(CompanyApplicationStatus.PENDING_EMAIL_VERIFICATION);
        assertThat(application.getOwnerUserId()).isNull();
        var command = ArgumentCaptor.forClass(NotificationEmailSender.NotificationEmailCommand.class);
        verify(sender).send(command.capture());
        assertThat(command.getValue().body()).contains("/verify-application-email#token=", "No password is required yet");
        String token = command.getValue().body().split("#token=")[1].split("\\s")[0];
        assertThat(token).hasSize(43);
        assertThat(application.getVerificationTokenHash()).isNotEqualTo(token);
    }

    @Test void verificationMakesApplicationReadyForReviewAndRejectsReplay() {
        application.setVerificationExpiresAt(now.plusSeconds(60));
        application.setVerificationTokenHash("hash");
        when(applications.findByVerificationTokenHash(anyString())).thenReturn(Optional.of(application), Optional.empty());
        assertThat(service.verify("token")).contains("ready for administrator review");
        assertThat(application.getEmailVerifiedAt()).isEqualTo(now);
        assertThat(application.getStatus()).isEqualTo(CompanyApplicationStatus.SUBMITTED);
        assertThat(application.getVerificationTokenHash()).isNull();
        assertThat(application.getVerificationExpiresAt()).isNull();
        var event = ArgumentCaptor.forClass(CompanyApplicationReviewEvent.class);
        verify(events).save(event.capture());
        assertThat(event.getValue().getCompanyApplicationId()).isEqualTo(1L);
        assertThat(event.getValue().getAction()).isEqualTo(CompanyApplicationReviewAction.EMAIL_VERIFIED);
        assertThat(event.getValue().getFromStatus()).isEqualTo(CompanyApplicationStatus.PENDING_EMAIL_VERIFICATION);
        assertThat(event.getValue().getToStatus()).isEqualTo(CompanyApplicationStatus.SUBMITTED);
        verifyNoInteractions(sender);
        assertThatThrownBy(() -> service.verify("token")).isInstanceOf(ApiException.class);
    }

    @Test void expiredOrReviewedApplicationsCannotConsumeVerificationTokens() {
        when(applications.findByVerificationTokenHash(anyString())).thenReturn(Optional.of(application));
        application.setVerificationExpiresAt(now);
        assertThatThrownBy(() -> service.verify("token")).isInstanceOf(ApiException.class);
        application.setVerificationExpiresAt(now.plusSeconds(60));
        application.setStatus(CompanyApplicationStatus.APPROVED);
        assertThatThrownBy(() -> service.verify("token")).isInstanceOf(ApiException.class);
        assertThat(application.getEmailVerifiedAt()).isNull();
        verifyNoInteractions(events);
    }

    @Test void failedDeliveryIsExplicit() {
        when(sender.send(any())).thenReturn(new NotificationEmailSender.DeliveryResult(false, "Provider unavailable"));
        assertThatThrownBy(() -> service.sendVerification(application)).isInstanceOf(ApiException.class)
                .hasMessageContaining("could not be sent");
    }

    @Test void resendUsesReferenceAndThrottleWithoutEmailReentry() {
        when(applications.findByApplicationNumber("APP-1")).thenReturn(Optional.of(application));
        application.setVerificationRequestedAt(now);
        service.resend("APP-1");
        verifyNoInteractions(sender);
        application.setVerificationRequestedAt(now.minus(Duration.ofMinutes(5)));
        when(sender.send(any())).thenReturn(new NotificationEmailSender.DeliveryResult(true, null));
        application.setVerificationTokenHash("old-token");
        service.resend("APP-1");
        assertThat(application.getVerificationTokenHash()).isNotEqualTo("old-token");
        verify(sender).send(any());
    }
}
