package com.transportplatform.tms.features.driver.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.notification.application.NotificationEventService;
import com.transportplatform.tms.features.driver.api.request.DriverDocumentReviewRequest;
import com.transportplatform.tms.features.driver.domain.Driver;
import com.transportplatform.tms.features.driver.domain.DriverDocument;
import com.transportplatform.tms.features.driver.domain.DriverDocumentRepository;
import com.transportplatform.tms.features.driver.domain.DriverDocumentStatus;
import com.transportplatform.tms.features.driver.domain.DriverDocumentType;
import com.transportplatform.tms.features.driver.domain.DriverDocumentVerificationStatus;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DriverDocumentServiceTest {

    @Mock
    private DriverDocumentRepository driverDocumentRepository;

    @Mock
    private DriverAccessService driverAccessService;

    @Mock
    private CurrentAuthenticatedUserService currentAuthenticatedUserService;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private NotificationEventService notificationEventService;

    @Test
    void rejectRequiresNotes() {
        DriverDocumentService driverDocumentService = new DriverDocumentService(
                driverDocumentRepository,
                driverAccessService,
                new DriverDocumentMapper(Clock.fixed(Instant.parse("2026-03-31T12:00:00Z"), ZoneOffset.UTC)),
                currentAuthenticatedUserService,
                auditLogService,
                notificationEventService,
                Clock.fixed(Instant.parse("2026-03-31T12:00:00Z"), ZoneOffset.UTC));

        Driver driver = new Driver();
        driver.setTenantId("tenant-123");

        DriverDocument document = new DriverDocument();
        document.setDriver(driver);
        document.setTenantId("tenant-123");
        document.setStatus(DriverDocumentStatus.ACTIVE);
        document.setDocumentType(DriverDocumentType.BACKGROUND_CHECK);
        document.setVerificationStatus(DriverDocumentVerificationStatus.PENDING);

        when(driverAccessService.requireCompanyTenantId()).thenReturn("tenant-123");
        when(driverDocumentRepository.findByIdAndTenantId(20L, "tenant-123")).thenReturn(Optional.of(document));

        ApiException exception = assertThrows(ApiException.class,
                () -> driverDocumentService.rejectCompanyDriverDocument(20L, new DriverDocumentReviewRequest("   ")));

        assertEquals("VALIDATION_FAILED", exception.getErrorCode().name());
    }
}