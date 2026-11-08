package com.transportplatform.tms.features.driverportal.application;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.security.*;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.compliance.application.ComplianceIssueSyncService;
import com.transportplatform.tms.features.driver.application.DriverDocumentStorageService;
import com.transportplatform.tms.features.driver.domain.*;
import com.transportplatform.tms.features.settings.application.TenantTimeService;
import java.time.*;
import java.util.List;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class DriverDocumentSubmissionTest {
    @Mock DriverPortalAccessService access;
    @Mock DriverDocumentRepository documents;
    @Mock DriverDocumentStorageService storage;
    @Mock CurrentAuthenticatedUserService current;
    @Mock TenantTimeService time;
    @Mock Clock clock;
    @Mock AuditLogService audit;
    @Mock ComplianceIssueSyncService compliance;
    @Spy DriverPortalMapper mapper = new DriverPortalMapper();
    @InjectMocks DriverPortalService service;
    final MockMultipartFile file = new MockMultipartFile("file", "license.pdf", "application/pdf", "%PDF-1.4".getBytes());
    @BeforeEach void scope() {
        Driver driver = new Driver(); driver.setTenantId("tenant"); ReflectionTestUtils.setField(driver, "id", 10L);
        when(access.resolveCurrentDriver()).thenReturn(driver);
    }
    @Test void incompleteOrInvalidMetadataIsRejectedBeforeAnyFileIsStored() {
        assertThrows(ApiException.class, () -> service.uploadDocument(DriverDocumentType.DRIVER_LICENSE,
                " ", "DMV", LocalDate.of(2026, 1, 1), LocalDate.of(2027, 1, 1), null, file));
        assertThrows(ApiException.class, () -> service.uploadDocument(DriverDocumentType.DRIVER_LICENSE,
                "DL-123", "DMV", LocalDate.of(2027, 1, 1), LocalDate.of(2026, 1, 1), null, file));
        assertThrows(ApiException.class, () -> service.uploadDocument(DriverDocumentType.DRIVER_LICENSE,
                "DL-123", "DMV", null, null, null, file));
        verifyNoInteractions(storage, documents);
    }
    @Test void submissionPersistsAndReturnsAllMetadataForReview() {
        when(current.requireCurrentUser()).thenReturn(new AuthenticatedUser(3L, "tenant", "driver@example.com", "Driver", "", "", true, true, false, List.of()));
        when(time.today("tenant")).thenReturn(LocalDate.of(2026, 11, 8));
        when(clock.instant()).thenReturn(Instant.parse("2026-11-08T14:00:00Z"));
        when(storage.store(eq("tenant"), eq(10L), eq(file))).thenReturn("tenant/10/license.pdf");
        when(documents.save(any())).thenAnswer(call -> {
            DriverDocument document = call.getArgument(0); ReflectionTestUtils.setField(document, "id", 1L); return document;
        });
        var response = service.uploadDocument(DriverDocumentType.DRIVER_LICENSE, " DL-123 ", " State DMV ",
                LocalDate.of(2026, 1, 1), LocalDate.of(2027, 1, 1), null, file);
        assertEquals("DL-123", response.documentNumber()); assertEquals("State DMV", response.issuingAuthority());
        assertEquals(LocalDate.of(2026, 1, 1), response.issueDate()); assertEquals(LocalDate.of(2027, 1, 1), response.expiryDate());
        assertEquals(DriverDocumentVerificationStatus.PENDING, response.verificationStatus());
        verify(compliance).synchronizeTenantIssues("tenant");
    }
}
