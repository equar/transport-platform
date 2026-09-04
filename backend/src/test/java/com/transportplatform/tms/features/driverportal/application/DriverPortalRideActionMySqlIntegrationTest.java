package com.transportplatform.tms.features.driverportal.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import com.transportplatform.tms.common.audit.JpaAuditConfig;
import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.auth.domain.AppUser;
import com.transportplatform.tms.features.auth.domain.AppUserRepository;
import com.transportplatform.tms.features.auth.domain.UserStatus;
import com.transportplatform.tms.features.compliance.application.ComplianceIssueSyncService;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssueRepository;
import com.transportplatform.tms.features.driver.application.DriverDocumentStorageService;
import com.transportplatform.tms.features.driver.domain.Driver;
import com.transportplatform.tms.features.driver.domain.DriverDocumentRepository;
import com.transportplatform.tms.features.driver.domain.DriverQualificationStatus;
import com.transportplatform.tms.features.driver.domain.DriverRepository;
import com.transportplatform.tms.features.driver.domain.DriverStatus;
import com.transportplatform.tms.features.driver.domain.DriverTrainingStatus;
import com.transportplatform.tms.features.driver.domain.DriverType;
import com.transportplatform.tms.features.driverportal.domain.DriverActionIdempotencyRepository;
import com.transportplatform.tms.features.notification.application.NotificationEventService;
import com.transportplatform.tms.features.notification.domain.NotificationRepository;
import com.transportplatform.tms.features.organization.domain.ServiceType;
import com.transportplatform.tms.features.portalaccess.application.PortalAccessService;
import com.transportplatform.tms.features.portalaccess.domain.PortalSubjectType;
import com.transportplatform.tms.features.portalaccess.domain.PortalUserScope;
import com.transportplatform.tms.features.portalaccess.domain.PortalUserScopeRepository;
import com.transportplatform.tms.features.rider.domain.GuardianRepository;
import com.transportplatform.tms.features.rider.domain.Rider;
import com.transportplatform.tms.features.rider.domain.RiderRepository;
import com.transportplatform.tms.features.rider.domain.RiderStatus;
import com.transportplatform.tms.features.rider.domain.RiderType;
import com.transportplatform.tms.features.ride.domain.Ride;
import com.transportplatform.tms.features.ride.domain.RideRepository;
import com.transportplatform.tms.features.ride.domain.RideStatus;
import com.transportplatform.tms.features.ride.domain.RideTripType;
import com.transportplatform.tms.features.rideevent.domain.RideEventRepository;
import com.transportplatform.tms.features.route.domain.RouteRepository;
import com.transportplatform.tms.features.route.domain.RouteStopRepository;
import com.transportplatform.tms.features.tenant.domain.Tenant;
import com.transportplatform.tms.features.tenant.domain.TenantRepository;
import com.transportplatform.tms.features.tenant.domain.TenantStatus;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@DataJpaTest(properties = "spring.flyway.enabled=true")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({
        JpaAuditConfig.class,
        CurrentAuthenticatedUserService.class,
        PortalAccessService.class,
        DriverPortalAccessService.class,
        DriverPortalMapper.class,
        DriverPortalService.class,
        DriverActionIdempotencyService.class,
        DriverPortalRideActionMySqlIntegrationTest.ClockTestConfiguration.class,
})
@Testcontainers
class DriverPortalRideActionMySqlIntegrationTest {

    @TestConfiguration
    static class ClockTestConfiguration {
        @Bean
        Clock clock() {
            return Clock.systemUTC();
        }
    }

    @Container
    private static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.0.45");

    @Autowired private TenantRepository tenantRepository;
    @Autowired private RiderRepository riderRepository;
    @Autowired private DriverRepository driverRepository;
    @Autowired private RideRepository rideRepository;
    @Autowired private PortalUserScopeRepository portalUserScopeRepository;
    @Autowired private AppUserRepository appUserRepository;
    @Autowired private RideEventRepository rideEventRepository;
    @Autowired private DriverActionIdempotencyRepository idempotencyRepository;
    @Autowired private DriverPortalService driverPortalService;
    @Autowired private DriverActionIdempotencyService idempotencyService;

    @MockBean private GuardianRepository guardianRepository;
    @MockBean private com.transportplatform.tms.features.organization.domain.OrganizationContactRepository organizationContactRepository;
    @MockBean private DriverDocumentRepository driverDocumentRepository;
    @MockBean private ComplianceIssueRepository complianceIssueRepository;
    @MockBean private NotificationRepository notificationRepository;
    @MockBean private RouteRepository routeRepository;
    @MockBean private RouteStopRepository routeStopRepository;
    @MockBean private AuditLogService auditLogService;
    @MockBean private NotificationEventService notificationEventService;
    @MockBean private DriverDocumentStorageService driverDocumentStorageService;
    @MockBean private ComplianceIssueSyncService complianceIssueSyncService;

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", MYSQL::getJdbcUrl);
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
        registry.add("spring.datasource.driver-class-name", MYSQL::getDriverClassName);
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void assignedDriverCanTransitionRideAndReplayIdempotently() {
        Driver driver = saveDriver("tenant-a");
        Ride ride = saveRide("tenant-a", driver.getId(), RideStatus.ASSIGNED);
        authenticate(driver, "tenant-a");

        idempotencyService.execute("driver-action-1", ride.getId(), "driver-en-route",
                () -> driverPortalService.markRideDriverEnRoute(ride.getId()),
                () -> driverPortalService.getMyRide(ride.getId()));
        idempotencyService.execute("driver-action-1", ride.getId(), "driver-en-route",
                () -> driverPortalService.markRideDriverEnRoute(ride.getId()),
                () -> driverPortalService.getMyRide(ride.getId()));

        assertThat(rideRepository.findById(ride.getId()).orElseThrow().getStatus()).isEqualTo(RideStatus.DRIVER_EN_ROUTE);
        assertThat(rideEventRepository.findAll()).hasSize(1);
        assertThat(idempotencyRepository.findAll()).hasSize(1);
    }

        @Test
        void assignedDriverCanCompleteFullRideLifecycleWithAuditableNotifications() {
        Driver driver = saveDriver("tenant-a");
        Ride ride = saveRide("tenant-a", driver.getId(), RideStatus.ASSIGNED);
        authenticate(driver, "tenant-a");

        driverPortalService.markRideDriverEnRoute(ride.getId());
        driverPortalService.markRideArrived(ride.getId());
        driverPortalService.markRidePickedUp(ride.getId());
        driverPortalService.markRideDroppedOff(ride.getId());
        driverPortalService.completeRide(ride.getId());

        assertThat(rideRepository.findById(ride.getId()).orElseThrow().getStatus())
            .isEqualTo(RideStatus.COMPLETED);
        assertThat(rideEventRepository.findAllByTenantIdAndRide_IdOrderByCreatedAtAsc("tenant-a", ride.getId()))
            .extracting(event -> event.getNewStatus())
            .containsExactly(
                RideStatus.DRIVER_EN_ROUTE,
                RideStatus.ARRIVED,
                RideStatus.PICKED_UP,
                RideStatus.DROPPED_OFF,
                RideStatus.COMPLETED);
        verify(auditLogService, times(5)).record(org.mockito.ArgumentMatchers.any());
        verify(notificationEventService, times(5)).publishRideStatusChanged(
            org.mockito.ArgumentMatchers.any(),
            org.mockito.ArgumentMatchers.any(),
            org.mockito.ArgumentMatchers.any());
        }

    @Test
    void driverCannotTransitionRideFromAnotherTenant() {
        Driver driver = saveDriver("tenant-a");
        Ride ride = saveRide("tenant-b", null, RideStatus.ASSIGNED);
        authenticate(driver, "tenant-a");

        assertThatThrownBy(() -> driverPortalService.markRideDriverEnRoute(ride.getId()))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("could not be found");
        assertThat(rideRepository.findById(ride.getId()).orElseThrow().getStatus()).isEqualTo(RideStatus.ASSIGNED);
    }

    @Test
    void driverReceivesConflictForInvalidCurrentRideState() {
        Driver driver = saveDriver("tenant-a");
        Ride ride = saveRide("tenant-a", driver.getId(), RideStatus.PICKED_UP);
        authenticate(driver, "tenant-a");

        assertThatThrownBy(() -> driverPortalService.markRideDriverEnRoute(ride.getId()))
                .isInstanceOf(ApiException.class)
            .hasMessageContaining("Only assigned rides can be marked as driver en route");
        assertThat(rideRepository.findById(ride.getId()).orElseThrow().getStatus()).isEqualTo(RideStatus.PICKED_UP);
    }

    private void authenticate(Driver driver, String tenantId) {
        AppUser appUser = new AppUser();
        appUser.setTenantId(tenantId);
        appUser.setEmail("driver-" + UUID.randomUUID() + "@example.com");
        appUser.setPasswordHash("not-used-by-integration-test");
        appUser.setStatus(UserStatus.ACTIVE);
        appUser = appUserRepository.saveAndFlush(appUser);
        PortalUserScope scope = new PortalUserScope();
        scope.setTenantId(tenantId);
        scope.setAppUserId(appUser.getId());
        scope.setPortalSubjectType(PortalSubjectType.DRIVER);
        scope.setPortalSubjectId(driver.getId());
        portalUserScopeRepository.saveAndFlush(scope);
        AuthenticatedUser user = new AuthenticatedUser(appUser.getId(), tenantId, appUser.getEmail(), "Casey", "Driver", "",
                true, true, false, List.of(new SimpleGrantedAuthority("ROLE_DRIVER")));
        SecurityContextHolder.getContext().setAuthentication(
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(user, null, user.getAuthorities()));
    }

    private Driver saveDriver(String tenantId) {
        saveTenant(tenantId);
        Driver driver = new Driver();
        driver.setTenantId(tenantId);
        driver.setDriverCode("driver-" + UUID.randomUUID());
        driver.setFirstName("Casey");
        driver.setLastName("Driver");
        driver.setPhone("555-0101");
        driver.setDriverType(DriverType.EMPLOYEE);
        driver.setStatus(DriverStatus.ACTIVE);
        driver.setBackgroundCheckStatus(DriverQualificationStatus.CLEAR);
        driver.setDrugTestStatus(DriverQualificationStatus.CLEAR);
        driver.setTrainingStatus(DriverTrainingStatus.COMPLETED);
        return driverRepository.saveAndFlush(driver);
    }

    private Ride saveRide(String tenantId, Long driverId, RideStatus status) {
        saveTenant(tenantId);
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
        ride.setDriverId(driverId);
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
        ride.setStatus(status);
        return rideRepository.saveAndFlush(ride);
    }

    private void saveTenant(String tenantId) {
        if (tenantRepository.existsById(tenantId)) return;
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
        tenantRepository.saveAndFlush(tenant);
    }
}