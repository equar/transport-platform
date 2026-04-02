package com.transportplatform.tms.features.driver.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.driver.api.request.DriverUpsertRequest;
import com.transportplatform.tms.features.driver.api.response.DriverComplianceSummaryResponse;
import com.transportplatform.tms.features.driver.domain.Driver;
import com.transportplatform.tms.features.driver.domain.DriverComplianceStatus;
import com.transportplatform.tms.features.driver.domain.DriverQualificationStatus;
import com.transportplatform.tms.features.driver.domain.DriverRepository;
import com.transportplatform.tms.features.driver.domain.DriverStatus;
import com.transportplatform.tms.features.driver.domain.DriverTrainingStatus;
import com.transportplatform.tms.features.driver.domain.DriverType;
import com.transportplatform.tms.features.notification.application.NotificationEventService;
import com.transportplatform.tms.features.saas.application.SubscriptionEnforcementService;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DriverServiceTest {

        @Mock
        private DriverRepository driverRepository;

        @Mock
        private DriverAccessService driverAccessService;

        @Mock
        private DriverCodeGenerator driverCodeGenerator;

        @Mock
        private DriverComplianceSummaryService driverComplianceSummaryService;

        @Mock
        private AuditLogService auditLogService;

        @Mock
        private NotificationEventService notificationEventService;

        @Mock
        private SubscriptionEnforcementService subscriptionEnforcementService;

        @Test
        void companyDriverCreationUsesTenantScopeAndPendingReview() {
                DriverService driverService = new DriverService(
                                driverRepository,
                                new DriverMapper(),
                                driverAccessService,
                                driverCodeGenerator,
                                driverComplianceSummaryService,
                                auditLogService,
                                notificationEventService,
                                subscriptionEnforcementService,
                                Clock.fixed(Instant.parse("2026-03-31T12:00:00Z"), ZoneOffset.UTC));

                when(driverAccessService.requireCompanyTenantId()).thenReturn("tenant-123");
                when(driverCodeGenerator.generate("tenant-123")).thenReturn("DRV-000123");
                when(driverRepository.save(any(Driver.class))).thenAnswer(invocation -> invocation.getArgument(0));
                when(driverComplianceSummaryService.getSummary(any(), any(Driver.class))).thenReturn(
                                new DriverComplianceSummaryResponse(4, 0, 0, 0, 4, DriverComplianceStatus.NON_COMPLIANT,
                                                null,
                                                Set.of()));

                driverService.createCompanyDriver(new DriverUpsertRequest(
                                "Taylor",
                                null,
                                "Lee",
                                null,
                                "taylor.driver@example.com",
                                "555-0100",
                                null,
                                null,
                                null,
                                null,
                                null,
                                null,
                                null,
                                DriverType.CONTRACTOR,
                                null,
                                null,
                                null,
                                null,
                                null,
                                null,
                                DriverQualificationStatus.PENDING,
                                null,
                                DriverQualificationStatus.PENDING,
                                null,
                                DriverTrainingStatus.NOT_STARTED,
                                null,
                                null,
                                null,
                                null,
                                null));

                ArgumentCaptor<Driver> driverCaptor = ArgumentCaptor.forClass(Driver.class);
                verify(driverRepository).save(driverCaptor.capture());
                verify(subscriptionEnforcementService).requireDriverCreationAllowed("tenant-123");
                assertEquals("tenant-123", driverCaptor.getValue().getTenantId());
                assertEquals("DRV-000123", driverCaptor.getValue().getDriverCode());
                assertEquals(DriverStatus.PENDING_REVIEW, driverCaptor.getValue().getStatus());
        }

        @Test
        void activateRejectsNonCompliantDriver() {
                DriverService driverService = new DriverService(
                                driverRepository,
                                new DriverMapper(),
                                driverAccessService,
                                driverCodeGenerator,
                                driverComplianceSummaryService,
                                auditLogService,
                                notificationEventService,
                                subscriptionEnforcementService,
                                Clock.fixed(Instant.parse("2026-03-31T12:00:00Z"), ZoneOffset.UTC));

                Driver driver = new Driver();
                driver.setTenantId("tenant-123");
                driver.setDriverCode("DRV-000123");
                driver.setStatus(DriverStatus.TRAINING_PENDING);
                driver.setTrainingStatus(DriverTrainingStatus.COMPLETED);
                driver.setLicenseNumber("LIC-1000");
                driver.setLicenseExpiryDate(LocalDate.of(2026, 12, 31));

                when(driverAccessService.findDriverForCompanyScope(10L)).thenReturn(driver);
                when(driverComplianceSummaryService.getSummary("tenant-123", driver)).thenReturn(
                                new DriverComplianceSummaryResponse(4, 3, 2, 1, 1, DriverComplianceStatus.NON_COMPLIANT,
                                                15, Set.of()));

                ApiException exception = assertThrows(ApiException.class,
                                () -> driverService.activateCompanyDriver(10L));

                assertEquals("INVALID_STATUS_TRANSITION", exception.getErrorCode().name());
        }
}