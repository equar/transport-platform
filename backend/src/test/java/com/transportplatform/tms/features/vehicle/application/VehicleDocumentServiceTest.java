package com.transportplatform.tms.features.vehicle.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.vehicle.api.request.VehicleDocumentReviewRequest;
import com.transportplatform.tms.features.vehicle.domain.Vehicle;
import com.transportplatform.tms.features.vehicle.domain.VehicleDocument;
import com.transportplatform.tms.features.vehicle.domain.VehicleDocumentRepository;
import com.transportplatform.tms.features.vehicle.domain.VehicleDocumentStatus;
import com.transportplatform.tms.features.vehicle.domain.VehicleDocumentType;
import com.transportplatform.tms.features.vehicle.domain.VehicleDocumentVerificationStatus;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class VehicleDocumentServiceTest {

    @Mock
    private VehicleDocumentRepository vehicleDocumentRepository;

    @Mock
    private VehicleAccessService vehicleAccessService;

    @Mock
    private CurrentAuthenticatedUserService currentAuthenticatedUserService;

    @Mock
    private AuditLogService auditLogService;

    @Test
    void rejectRequiresNotes() {
        VehicleDocumentService vehicleDocumentService = new VehicleDocumentService(
                vehicleDocumentRepository,
                vehicleAccessService,
                new VehicleDocumentMapper(Clock.fixed(Instant.parse("2026-03-31T12:00:00Z"), ZoneOffset.UTC)),
                currentAuthenticatedUserService,
                auditLogService,
                Clock.fixed(Instant.parse("2026-03-31T12:00:00Z"), ZoneOffset.UTC));

        Vehicle vehicle = new Vehicle();
        vehicle.setTenantId("tenant-123");

        VehicleDocument document = new VehicleDocument();
        document.setVehicle(vehicle);
        document.setTenantId("tenant-123");
        document.setStatus(VehicleDocumentStatus.ACTIVE);
        document.setDocumentType(VehicleDocumentType.VEHICLE_INSURANCE);
        document.setVerificationStatus(VehicleDocumentVerificationStatus.PENDING);

        when(vehicleAccessService.requireCompanyTenantId()).thenReturn("tenant-123");
        when(vehicleDocumentRepository.findByIdAndTenantId(20L, "tenant-123")).thenReturn(Optional.of(document));

        ApiException exception = assertThrows(ApiException.class,
                () -> vehicleDocumentService.rejectCompanyVehicleDocument(20L,
                        new VehicleDocumentReviewRequest("   ")));

        assertEquals("VALIDATION_FAILED", exception.getErrorCode().name());
    }
}