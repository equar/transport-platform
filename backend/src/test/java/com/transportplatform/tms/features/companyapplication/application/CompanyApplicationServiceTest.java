package com.transportplatform.tms.features.companyapplication.application;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.companyapplication.api.request.*;
import com.transportplatform.tms.features.companyapplication.domain.*;
import java.time.Instant;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class CompanyApplicationServiceTest {
    private final CompanyApplicationRepository applications = mock(CompanyApplicationRepository.class);
    private final CompanyApplicationReviewEventRepository events = mock(CompanyApplicationReviewEventRepository.class);
    private final CompanyApplicationNotificationPort notifications = mock(CompanyApplicationNotificationPort.class);
    private final CompanyApplicationApprovalService approval = mock(CompanyApplicationApprovalService.class);
    private final ApplicationEmailVerificationService verification = mock(ApplicationEmailVerificationService.class);
    private final CompanyApplicationService service = new CompanyApplicationService(applications, events,
            new CompanyApplicationMapper(), notifications, approval, mock(AuditLogService.class), verification);
    private final CompanyApplicationReviewRequest review = new CompanyApplicationReviewRequest(
            "Reviewed", null, "STARTER", null, "applicant@example.test");

    @Test void submissionWaitsForEmailBeforeReview() {
        when(applications.saveAndFlush(any())).thenAnswer(invocation -> {
            CompanyApplication application = invocation.getArgument(0);
            ReflectionTestUtils.setField(application, "id", 1L);
            return application;
        });
        when(applications.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        var request = new CompanyApplicationSubmissionRequest("Transit", null, "Test", "Applicant",
                "applicant@example.test", "5550100", "Transport", "1 Main", null, "City", "State",
                "12345", "US", Set.of("NEMT"), 1, 1, null);
        var result = service.submit(request);
        assertThat(result.status()).isEqualTo(CompanyApplicationStatus.PENDING_EMAIL_VERIFICATION);
        verify(verification).sendVerification(any());
        verifyNoInteractions(approval, notifications);
    }

    @Test void reviewAndApprovalAreBlockedWithoutEmailVerification() {
        var application = application(CompanyApplicationStatus.SUBMITTED, false);
        when(applications.findWithWriteLockById(1L)).thenReturn(Optional.of(application));
        assertThatThrownBy(() -> service.moveToUnderReview(1L, review)).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> service.approve(1L, review)).isInstanceOf(ApiException.class);
        verifyNoInteractions(approval);
    }

    @Test void verifiedApplicationMustBeReviewedBeforeApproval() {
        var application = application(CompanyApplicationStatus.SUBMITTED, true);
        when(applications.findWithWriteLockById(1L)).thenReturn(Optional.of(application));
        when(applications.saveAndFlush(any())).thenAnswer(invocation -> invocation.getArgument(0));
        assertThatThrownBy(() -> service.approve(1L, review)).isInstanceOf(ApiException.class);
        service.moveToUnderReview(1L, review);
        when(approval.approve(application, review)).thenReturn(new CompanyApplicationApprovalService.ApprovalResult("tenant-a", 7L));
        var result = service.approve(1L, review);
        assertThat(result.status()).isEqualTo(CompanyApplicationStatus.APPROVED);
        verify(notifications).applicationApproved(application);
    }

    private CompanyApplication application(CompanyApplicationStatus status, boolean verified) {
        var application = new CompanyApplication();
        ReflectionTestUtils.setField(application, "id", 1L);
        application.setApplicationNumber("APP-1");
        application.setEmail("applicant@example.test");
        application.setStatus(status);
        if (verified) application.setEmailVerifiedAt(Instant.now());
        return application;
    }
}
