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
import com.transportplatform.tms.features.compliance.application.ComplianceIssueSyncService;

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

    @Mock
    private DriverDocumentStorageService driverDocumentStorageService;

    @Mock
    private ComplianceIssueSyncService complianceIssueSyncService;

    @Test
    void incompleteLegacyDocumentCannotBeApproved() {
        var service = new DriverDocumentService(driverDocumentRepository, driverAccessService,
                new DriverDocumentMapper(Clock.systemUTC()), currentAuthenticatedUserService, auditLogService,
                notificationEventService, driverDocumentStorageService, complianceIssueSyncService, Clock.systemUTC());
        DriverDocument document = new DriverDocument(); document.setTenantId("tenant-123");
        document.setStatus(DriverDocumentStatus.ACTIVE); document.setVerificationStatus(DriverDocumentVerificationStatus.PENDING);
        when(driverAccessService.requireCompanyTenantId()).thenReturn("tenant-123");
        when(driverDocumentRepository.findByIdAndTenantId(20L, "tenant-123")).thenReturn(Optional.of(document));
        assertThrows(ApiException.class, () -> service.verifyCompanyDriverDocument(20L, new DriverDocumentReviewRequest(null, 0L)));
        org.mockito.Mockito.verify(driverDocumentRepository, org.mockito.Mockito.never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void rejectRequiresNotes() {
        DriverDocumentService driverDocumentService = new DriverDocumentService(
                driverDocumentRepository,
                driverAccessService,
                new DriverDocumentMapper(Clock.fixed(Instant.parse("2026-03-31T12:00:00Z"), ZoneOffset.UTC)),
                currentAuthenticatedUserService,
                auditLogService,
                notificationEventService,
                driverDocumentStorageService,
                complianceIssueSyncService,
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
                () -> driverDocumentService.rejectCompanyDriverDocument(20L, new DriverDocumentReviewRequest("   ", 0L)));

        assertEquals("VALIDATION_FAILED", exception.getErrorCode().name());
    }
    @Test void staleReviewCannotApproveNewMetadata() {
        var service = new DriverDocumentService(driverDocumentRepository,driverAccessService,new DriverDocumentMapper(Clock.systemUTC()),currentAuthenticatedUserService,auditLogService,notificationEventService,driverDocumentStorageService,complianceIssueSyncService,Clock.systemUTC());
        var document = new DriverDocument(); document.setTenantId("tenant");
        when(driverAccessService.requireCompanyTenantId()).thenReturn("tenant");
        when(driverDocumentRepository.findByIdAndTenantId(20L,"tenant")).thenReturn(Optional.of(document));
        var error = assertThrows(ApiException.class,()->service.verifyCompanyDriverDocument(20L,new DriverDocumentReviewRequest(null,1L)));
        assertEquals("RESOURCE_CONFLICT",error.getErrorCode().name());
        org.mockito.Mockito.verifyNoInteractions(driverDocumentStorageService);
    }
    @Test void completeMetadataWithoutReadableEvidenceCannotClearQualification() {
        var service = new DriverDocumentService(driverDocumentRepository,driverAccessService,new DriverDocumentMapper(Clock.systemUTC()),currentAuthenticatedUserService,auditLogService,notificationEventService,driverDocumentStorageService,complianceIssueSyncService,Clock.systemUTC());
        var driver = new Driver(); org.springframework.test.util.ReflectionTestUtils.setField(driver,"id",1L);driver.setBackgroundCheckStatus(com.transportplatform.tms.features.driver.domain.DriverQualificationStatus.PENDING);
        var document = new DriverDocument();document.setTenantId("tenant");document.setDriver(driver);document.setDocumentType(DriverDocumentType.BACKGROUND_CHECK);document.setDocumentNumber("TEST");document.setIssuingAuthority("Test issuer");document.setIssueDate(java.time.LocalDate.of(2026,1,1));document.setExpiryDate(java.time.LocalDate.of(2027,1,1));document.setStatus(DriverDocumentStatus.ACTIVE);document.setVerificationStatus(DriverDocumentVerificationStatus.PENDING);
        when(driverAccessService.requireCompanyTenantId()).thenReturn("tenant");when(driverDocumentRepository.findByIdAndTenantId(20L,"tenant")).thenReturn(Optional.of(document));
        when(driverDocumentStorageService.load("tenant",1L,null,null,null)).thenThrow(new ApiException(com.transportplatform.tms.common.exception.ErrorCode.RESOURCE_NOT_FOUND,org.springframework.http.HttpStatus.NOT_FOUND,"No uploaded file is attached"));
        assertThrows(ApiException.class,()->service.verifyCompanyDriverDocument(20L,new DriverDocumentReviewRequest(null,0L)));
        assertEquals(com.transportplatform.tms.features.driver.domain.DriverQualificationStatus.PENDING,driver.getBackgroundCheckStatus());
        org.mockito.Mockito.verify(driverDocumentRepository,org.mockito.Mockito.never()).saveAndFlush(org.mockito.ArgumentMatchers.any());
    }
}
