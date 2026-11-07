package com.transportplatform.tms.features.ride.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.transportplatform.tms.common.audit.JpaAuditConfig;
import com.transportplatform.tms.features.organization.domain.ServiceType;
import com.transportplatform.tms.features.rider.domain.Rider;
import com.transportplatform.tms.features.rider.domain.RiderRepository;
import com.transportplatform.tms.features.rider.domain.RiderStatus;
import com.transportplatform.tms.features.rider.domain.RiderType;
import com.transportplatform.tms.features.tenant.domain.Tenant;
import com.transportplatform.tms.features.tenant.domain.TenantRepository;
import com.transportplatform.tms.features.tenant.domain.TenantStatus;
import jakarta.persistence.EntityManager;
import java.time.LocalDateTime;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@DataJpaTest(properties = "spring.flyway.enabled=true")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(JpaAuditConfig.class)
@Testcontainers
class RideRepositoryMySqlIntegrationTest {

    @Container
    private static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.0.45");

    @Autowired
    private RideRepository rideRepository;

    @Autowired
    private RiderRepository riderRepository;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private EntityManager entityManager;

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", MYSQL::getJdbcUrl);
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
        registry.add("spring.datasource.driver-class-name", MYSQL::getDriverClassName);
    }

    @Test
    void findByIdAndTenantIdDoesNotReturnAnotherTenantsRide() {
        Ride ride = saveRide("tenant-a");

        assertThat(rideRepository.findByIdAndTenantId(ride.getId(), "tenant-a")).isPresent();
        assertThat(rideRepository.findByIdAndTenantId(ride.getId(), "tenant-b")).isEmpty();
    }

    @Test
    void rejectsStaleRideUpdateWithOptimisticLockConflict() {
        Ride ride = saveRide("tenant-a");
        entityManager.clear();

        Ride staleRide = rideRepository.findById(ride.getId()).orElseThrow();
        entityManager.detach(staleRide);
        Ride currentRide = rideRepository.findById(ride.getId()).orElseThrow();
        currentRide.setOperationalNotes("Current update");
        rideRepository.saveAndFlush(currentRide);

        staleRide.setOperationalNotes("Stale update");

        assertThatThrownBy(() -> rideRepository.saveAndFlush(staleRide))
                .isInstanceOf(OptimisticLockingFailureException.class);
    }

    @Autowired private org.springframework.transaction.PlatformTransactionManager transactions;
    @Autowired private com.transportplatform.tms.features.driver.domain.DriverRepository drivers;
    @Autowired private com.transportplatform.tms.features.vehicle.domain.VehicleRepository vehicles;

    @Test
    @org.springframework.transaction.annotation.Transactional(propagation=org.springframework.transaction.annotation.Propagation.NOT_SUPPORTED)
    void concurrentOverlappingAssignmentsAllowOnlyOneRideToClaimTheDriver() throws Exception {
        String tenantId=UUID.randomUUID().toString();
        var tx=new org.springframework.transaction.support.TransactionTemplate(transactions);
        var ids=tx.execute(status -> {
            Ride first=saveRide(tenantId),second=saveRide(tenantId);
            second.setScheduledPickupAt(first.getScheduledPickupAt());rideRepository.saveAndFlush(second);
            var driver=new com.transportplatform.tms.features.driver.domain.Driver();
            driver.setTenantId(tenantId);driver.setDriverCode("driver-"+UUID.randomUUID());driver.setFirstName("Casey");driver.setLastName("Driver");driver.setPhone("555-0101");
            driver.setDriverType(com.transportplatform.tms.features.driver.domain.DriverType.EMPLOYEE);
            driver.setStatus(com.transportplatform.tms.features.driver.domain.DriverStatus.ACTIVE);
            driver.setBackgroundCheckStatus(com.transportplatform.tms.features.driver.domain.DriverQualificationStatus.CLEAR);
            driver.setDrugTestStatus(com.transportplatform.tms.features.driver.domain.DriverQualificationStatus.CLEAR);
            driver.setTrainingStatus(com.transportplatform.tms.features.driver.domain.DriverTrainingStatus.COMPLETED);
            drivers.saveAndFlush(driver);
            return java.util.List.of(first.getId(),second.getId(),driver.getId());
        });
        var access=org.mockito.Mockito.mock(com.transportplatform.tms.features.ride.application.RideAccessService.class);
        org.mockito.Mockito.when(access.requireCompanyTenantId()).thenReturn(tenantId);
        org.mockito.Mockito.when(access.findRideForCompanyScope(org.mockito.ArgumentMatchers.anyLong())).thenAnswer(call -> rideRepository.findByIdAndTenantId(call.getArgument(0),tenantId).orElseThrow());
        var compliance=org.mockito.Mockito.mock(com.transportplatform.tms.features.driver.application.DriverComplianceSummaryService.class,org.mockito.Mockito.RETURNS_DEEP_STUBS);
        org.mockito.Mockito.when(compliance.getSummary(org.mockito.ArgumentMatchers.eq(tenantId),org.mockito.ArgumentMatchers.any()).overallStatus()).thenReturn(com.transportplatform.tms.features.driver.domain.DriverComplianceStatus.COMPLIANT);
        var approval=org.mockito.Mockito.mock(com.transportplatform.tms.features.compliance.application.TenantTransportComplianceService.class);
        org.mockito.Mockito.when(approval.isDispatchApproved(tenantId)).thenReturn(true);
        var validator=new com.transportplatform.tms.features.dispatch.application.DispatchAssignmentValidationService(rideRepository,drivers,vehicles,compliance,
            org.mockito.Mockito.mock(com.transportplatform.tms.features.vehicle.application.VehicleComplianceSummaryService.class),approval,
            org.mockito.Mockito.mock(com.transportplatform.tms.features.route.domain.RouteStopRepository.class));
        var dispatch=new com.transportplatform.tms.features.dispatch.application.DispatchService(tenantRepository,
            org.mockito.Mockito.mock(com.transportplatform.tms.features.settings.domain.TenantSettingsRepository.class),java.time.Clock.systemUTC(),rideRepository,
            org.mockito.Mockito.mock(com.transportplatform.tms.features.location.domain.DriverLocationSnapshotRepository.class),drivers,vehicles,access,validator,
            org.mockito.Mockito.mock(com.transportplatform.tms.features.dispatch.application.DispatchMapper.class),
            org.mockito.Mockito.mock(com.transportplatform.tms.features.rideevent.application.RideEventService.class),
            org.mockito.Mockito.mock(com.transportplatform.tms.features.audit.application.AuditLogService.class),
            org.mockito.Mockito.mock(com.transportplatform.tms.features.notification.application.NotificationEventService.class));
        var start=new java.util.concurrent.CountDownLatch(1);
        try(var executor=java.util.concurrent.Executors.newFixedThreadPool(2)) {
            var futures=new java.util.ArrayList<java.util.concurrent.Future<Boolean>>();
            for(Long rideId:ids.subList(0,2)) futures.add(executor.submit(() -> {
                start.await();
                try {return tx.execute(status -> {dispatch.replaceRideResources(rideId,ids.get(2),null,0L);return true;});}
                catch(com.transportplatform.tms.common.exception.ApiException ex) {
                    assertThat(ex.getErrorCode()).isEqualTo(com.transportplatform.tms.common.exception.ErrorCode.RESOURCE_CONFLICT);return false;
                }
            }));
            start.countDown();
            int accepted=0;for(var future:futures) if(future.get(20,java.util.concurrent.TimeUnit.SECONDS)) accepted++;
            assertThat(accepted).isEqualTo(1);
        }
    }

    @Autowired private com.transportplatform.tms.features.route.domain.RouteRepository routes;
    @Autowired private com.transportplatform.tms.features.route.domain.RouteStopRepository routeStops;

    @Test
    void pooledCapacityUsesPersistedRouteRidesAndAllowsReusingWheelchairSpace() {
        String tenantId = "capacity-tenant";
        Ride first = saveRide(tenantId), second = saveRide(tenantId);
        var route = new com.transportplatform.tms.features.route.domain.Route();
        route.setTenantId(tenantId); route.setRouteCode("CAPACITY"); route.setRouteName("Capacity trial");
        route.setRouteDate(java.time.LocalDate.of(2026, 11, 7)); route.setServiceType(ServiceType.NEMT);
        route.setStatus(com.transportplatform.tms.features.route.domain.RouteStatus.PLANNED);
        routes.saveAndFlush(route);
        var start = java.time.LocalDateTime.of(2026, 11, 7, 9, 0);
        for (Ride ride : java.util.List.of(first, second)) {
            ride.setRouteId(route.getId()); ride.setWheelchairRequired(true);
            ride.setScheduledPickupAt(start); ride.setScheduledDropoffAt(start.plusHours(1));
            rideRepository.saveAndFlush(ride);
        }
        var vehicle = new com.transportplatform.tms.features.vehicle.domain.Vehicle();
        vehicle.setTenantId(tenantId); vehicle.setVehicleCode("CAPACITY-VAN");
        vehicle.setOwnershipType(com.transportplatform.tms.features.vehicle.domain.VehicleOwnershipType.COMPANY_OWNED);
        vehicle.setMake("Ford"); vehicle.setModel("Transit"); vehicle.setYear(2024);
        vehicle.setPlateNumber("CAPACITY"); vehicle.setPlateState("IL"); vehicle.setCapacity(8); vehicle.setWheelchairCapacity(1);
        vehicle.setStatus(com.transportplatform.tms.features.vehicle.domain.VehicleStatus.ACTIVE);
        vehicles.saveAndFlush(vehicle);
        var compliance = org.mockito.Mockito.mock(com.transportplatform.tms.features.vehicle.application.VehicleComplianceSummaryService.class,
                org.mockito.Mockito.RETURNS_DEEP_STUBS);
        org.mockito.Mockito.when(compliance.getSummary(tenantId, vehicle).overallStatus())
                .thenReturn(com.transportplatform.tms.features.vehicle.domain.VehicleComplianceStatus.COMPLIANT);
        var approval = org.mockito.Mockito.mock(com.transportplatform.tms.features.compliance.application.TenantTransportComplianceService.class);
        org.mockito.Mockito.when(approval.isDispatchApproved(tenantId)).thenReturn(true);
        var validation = new com.transportplatform.tms.features.dispatch.application.DispatchAssignmentValidationService(
                rideRepository, drivers, vehicles, org.mockito.Mockito.mock(com.transportplatform.tms.features.driver.application.DriverComplianceSummaryService.class),
                compliance, approval, routeStops);
        assertThatThrownBy(() -> validation.requireAssignableVehicle(tenantId, first, vehicle.getId()))
                .isInstanceOf(com.transportplatform.tms.common.exception.ApiException.class)
                .hasMessageContaining("wheelchair capacity");
        second.setScheduledPickupAt(start.plusHours(1)); second.setScheduledDropoffAt(start.plusHours(2));
        rideRepository.saveAndFlush(second);
        org.junit.jupiter.api.Assertions.assertDoesNotThrow(() -> validation.requireAssignableVehicle(tenantId, first, vehicle.getId()));
    }

    private Ride saveRide(String tenantId) {
        Tenant tenant = new Tenant();
        tenant.setId(tenantId);
        tenant.setTenantCode("tenant-" + UUID.randomUUID());
        tenant.setCompanyName("Example Transport");
        tenant.setLegalName("Example Transport LLC " + UUID.randomUUID());
        tenant.setEmail("operations@example.com");
        tenant.setPhone("555-0100");
        tenant.setAddressLine1("1 Operations Way");
        tenant.setCity("Springfield");
        tenant.setState("IL");
        tenant.setZipCode("62701");
        tenant.setCountry("US");
        tenant.setBusinessType("Transportation");
        tenant.setSubscriptionPlan("STANDARD");
        tenant.setStatus(TenantStatus.ACTIVE);
        if(!tenantRepository.existsById(tenantId)) tenantRepository.saveAndFlush(tenant);

        Rider rider = new Rider();
        rider.setTenantId(tenantId);
        rider.setRiderCode("rider-" + UUID.randomUUID());
        rider.setRiderType(RiderType.NEMT);
        rider.setFirstName("Taylor");
        rider.setLastName("Rider");
        rider.setPrimaryPhone("555-0100");
        rider.setStatus(RiderStatus.ACTIVE);
        riderRepository.saveAndFlush(rider);

        Ride ride = new Ride();
        ride.setTenantId(tenantId);
        ride.setRideNumber("ride-" + UUID.randomUUID());
        ride.setRider(rider);
        ride.setServiceType(ServiceType.NEMT);
        ride.setTripType(RideTripType.ONE_WAY);
        ride.setPickupAddressLine1("1 Pickup Street");
        ride.setPickupCity("Springfield");
        ride.setPickupState("IL");
        ride.setPickupZipCode("62701");
        ride.setPickupCountry("US");
        ride.setDropoffAddressLine1("2 Dropoff Street");
        ride.setDropoffCity("Springfield");
        ride.setDropoffState("IL");
        ride.setDropoffZipCode("62701");
        ride.setDropoffCountry("US");
        ride.setScheduledPickupAt(LocalDateTime.now().plusDays(1));
        ride.setStatus(RideStatus.SCHEDULED);
        return rideRepository.saveAndFlush(ride);
    }
}