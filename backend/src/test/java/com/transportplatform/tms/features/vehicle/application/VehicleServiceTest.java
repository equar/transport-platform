package com.transportplatform.tms.features.vehicle.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.vehicle.api.request.VehicleUpsertRequest;
import com.transportplatform.tms.features.vehicle.api.response.VehicleComplianceSummaryResponse;
import com.transportplatform.tms.features.vehicle.domain.Vehicle;
import com.transportplatform.tms.features.vehicle.domain.VehicleComplianceStatus;
import com.transportplatform.tms.features.vehicle.domain.VehicleOwnershipType;
import com.transportplatform.tms.features.vehicle.domain.VehicleRepository;
import com.transportplatform.tms.features.vehicle.domain.VehicleStatus;
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
class VehicleServiceTest {

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private VehicleAccessService vehicleAccessService;

    @Mock
    private VehicleCodeGenerator vehicleCodeGenerator;

    @Mock
    private VehicleComplianceSummaryService vehicleComplianceSummaryService;

    @Mock
    private AuditLogService auditLogService;

    @Test
    void companyVehicleCreationUsesTenantScopeAndInactiveDefault() {
        VehicleService vehicleService = new VehicleService(
                vehicleRepository,
                new VehicleMapper(),
                vehicleAccessService,
                vehicleCodeGenerator,
                vehicleComplianceSummaryService,
                auditLogService,
                Clock.fixed(Instant.parse("2026-03-31T12:00:00Z"), ZoneOffset.UTC));

        when(vehicleAccessService.requireCompanyTenantId()).thenReturn("tenant-123");
        when(vehicleCodeGenerator.generate("tenant-123")).thenReturn("VEH-000123");
        when(vehicleRepository.save(any(Vehicle.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(vehicleComplianceSummaryService.getSummary(any(), any(Vehicle.class))).thenReturn(
                new VehicleComplianceSummaryResponse(3, 0, 0, 0, 3, VehicleComplianceStatus.NON_COMPLIANT, null,
                        Set.of()));

        vehicleService.createCompanyVehicle(new VehicleUpsertRequest(
                VehicleOwnershipType.COMPANY_OWNED,
                "Ford",
                "Transit",
                2024,
                "White",
                "1HGCM82633A123456",
                "ABC-1234",
                "TX",
                6,
                2,
                Set.of("NEMT", "WHEELCHAIR"),
                null,
                "POL-1000",
                LocalDate.of(2026, 12, 31),
                LocalDate.of(2026, 12, 31),
                LocalDate.of(2026, 12, 31),
                12000L,
                null,
                null));

        ArgumentCaptor<Vehicle> vehicleCaptor = ArgumentCaptor.forClass(Vehicle.class);
        verify(vehicleRepository).save(vehicleCaptor.capture());
        assertEquals("tenant-123", vehicleCaptor.getValue().getTenantId());
        assertEquals("VEH-000123", vehicleCaptor.getValue().getVehicleCode());
        assertEquals(VehicleStatus.INACTIVE, vehicleCaptor.getValue().getStatus());
    }

    @Test
    void activateRejectsNonCompliantVehicle() {
        VehicleService vehicleService = new VehicleService(
                vehicleRepository,
                new VehicleMapper(),
                vehicleAccessService,
                vehicleCodeGenerator,
                vehicleComplianceSummaryService,
                auditLogService,
                Clock.fixed(Instant.parse("2026-03-31T12:00:00Z"), ZoneOffset.UTC));

        Vehicle vehicle = new Vehicle();
        vehicle.setTenantId("tenant-123");
        vehicle.setVehicleCode("VEH-000123");
        vehicle.setStatus(VehicleStatus.INACTIVE);
        vehicle.setInsuranceExpiryDate(LocalDate.of(2026, 12, 31));
        vehicle.setRegistrationExpiryDate(LocalDate.of(2026, 12, 31));
        vehicle.setInspectionExpiryDate(LocalDate.of(2026, 12, 31));

        when(vehicleAccessService.findVehicleForCompanyScope(10L)).thenReturn(vehicle);
        when(vehicleComplianceSummaryService.getSummary("tenant-123", vehicle)).thenReturn(
                new VehicleComplianceSummaryResponse(3, 2, 2, 1, 1, VehicleComplianceStatus.NON_COMPLIANT, 15,
                        Set.of()));

        ApiException exception = assertThrows(ApiException.class,
                () -> vehicleService.activateCompanyVehicle(10L));

        assertEquals("INVALID_STATUS_TRANSITION", exception.getErrorCode().name());
    }
}