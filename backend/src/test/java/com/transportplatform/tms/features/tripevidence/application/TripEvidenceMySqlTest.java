package com.transportplatform.tms.features.tripevidence.application;

import static com.transportplatform.tms.features.tripevidence.api.TripEvidenceRecords.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

import com.transportplatform.tms.common.audit.JpaAuditConfig;
import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.driver.domain.Driver;
import com.transportplatform.tms.features.driver.domain.DriverQualificationStatus;
import com.transportplatform.tms.features.driver.domain.DriverRepository;
import com.transportplatform.tms.features.driver.domain.DriverStatus;
import com.transportplatform.tms.features.driver.domain.DriverTrainingStatus;
import com.transportplatform.tms.features.driver.domain.DriverType;
import com.transportplatform.tms.features.driverportal.application.DriverPortalAccessService;
import com.transportplatform.tms.features.location.domain.*;
import com.transportplatform.tms.features.organization.domain.ServiceType;
import com.transportplatform.tms.features.portalaccess.domain.PortalSubjectType;
import com.transportplatform.tms.features.ride.application.RideAccessService;
import com.transportplatform.tms.features.ride.domain.Ride;
import com.transportplatform.tms.features.ride.domain.RideRepository;
import com.transportplatform.tms.features.ride.domain.RideStatus;
import com.transportplatform.tms.features.ride.domain.RideTripType;
import com.transportplatform.tms.features.rider.domain.*;
import com.transportplatform.tms.features.rider.domain.Rider;
import com.transportplatform.tms.features.rider.domain.RiderRepository;
import com.transportplatform.tms.features.rider.domain.RiderStatus;
import com.transportplatform.tms.features.rider.domain.RiderType;
import com.transportplatform.tms.features.riderguardianportal.application.RiderGuardianPortalAccessService;
import com.transportplatform.tms.features.tenant.domain.Tenant;
import com.transportplatform.tms.features.tenant.domain.TenantRepository;
import com.transportplatform.tms.features.tenant.domain.TenantStatus;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@DataJpaTest(properties = "spring.flyway.enabled=true")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({
  JpaAuditConfig.class,
  TripEvidenceService.class,
  TripEvidenceMySqlTest.Config.class,
  com.transportplatform.tms.features.subscriptionbilling.application.DriverMeteringListener.class
})
@Testcontainers
class TripEvidenceMySqlTest {
  @Container static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.0.45");

  @DynamicPropertySource
  static void datasource(DynamicPropertyRegistry r) {
    r.add("spring.datasource.url", MYSQL::getJdbcUrl);
    r.add("spring.datasource.username", MYSQL::getUsername);
    r.add("spring.datasource.password", MYSQL::getPassword);
    r.add("spring.datasource.driver-class-name", MYSQL::getDriverClassName);
  }

  static class MutableClock extends Clock {
    Instant time;

    public ZoneId getZone() {
      return ZoneOffset.UTC;
    }

    public Clock withZone(ZoneId z) {
      return this;
    }

    public Instant instant() {
      return time;
    }
  }

  @TestConfiguration
  static class Config {
    @Bean
    MutableClock clock() {
      return new MutableClock();
    }
  }

  @Autowired TripEvidenceService service;
  @Autowired MutableClock clock;
  @Autowired JdbcTemplate db;
  @Autowired TenantRepository tenantRepository;
  @Autowired DriverRepository driverRepository;
  @Autowired RideRepository rideRepository;
  @Autowired RiderRepository riderRepository;
  @Autowired com.transportplatform.tms.features.vehicle.domain.VehicleRepository vehicles;
  @Autowired DriverLocationSnapshotRepository snapshots;
  @MockBean RideAccessService company;
  @MockBean DriverPortalAccessService driverAccess;
  @MockBean RiderGuardianPortalAccessService passenger;
  @MockBean CurrentAuthenticatedUserService users;
  @MockBean AuditLogService audit;
  @MockBean com.transportplatform.tms.features.notification.application.NotificationEventService notifications;
  Ride ride;
  Driver driver;
  AuthenticatedUser user;

  @BeforeEach
  void setup() {
    clock.time = Instant.now().plusSeconds(1);
    String tenant = UUID.randomUUID().toString();
    driver = saveDriver(tenant);
    ride = saveRide(tenant, driver.getId(), RideStatus.DRIVER_EN_ROUTE);
    user =
        new AuthenticatedUser(
            101L,
            tenant,
            "passenger@example.test",
            "Taylor",
            "Rider",
            "",
            true,
            true,
            false,
            List.of(new SimpleGrantedAuthority("ROLE_RIDER")));
    when(users.requireCurrentUser()).thenReturn(user);
    when(company.findRideForCompanyScope(ride.getId())).thenReturn(ride);
    when(driverAccess.requireAssignedRide(ride.getId())).thenReturn(ride);
    when(passenger.resolveCurrentScope())
        .thenReturn(
            new RiderGuardianPortalAccessService.ResolvedRiderGuardianScope(
                user,
                PortalSubjectType.RIDER,
                ride.getRider(),
                null,
                List.of(),
                List.of(ride.getRider())));
  }

  void stops() {
    service.configure(ride.getId(), new Stops(42.0, -71.0, 42.01, -71.01));
  }

  DriverLocationSnapshot gps(double latitude, double longitude, Double accuracy, Instant captured) {
    var s = new DriverLocationSnapshot();
    s.setTenantId(ride.getTenantId());
    s.setRide(ride);
    s.setDriver(driver);
    s.setVehicleId(ride.getVehicleId());
    s.setLatitude(latitude);
    s.setLongitude(longitude);
    s.setAccuracyMeters(accuracy);
    s.setCapturedAt(captured);
    return snapshots.saveAndFlush(s);
  }

  void stage(String milestone, String odo) {
    boolean drop = milestone.equals("DROPPED_OFF");
    gps(drop ? 42.01 : 42.0, drop ? -71.01 : -71.0, 10.0, clock.instant());
    service.capture(
        ride.getId(), new Capture(milestone, odo == null ? null : new BigDecimal(odo), false));
    service.requireMilestone(ride, milestone);
    ride.setStatus(RideStatus.valueOf(milestone));
    rideRepository.saveAndFlush(ride);
  }

  @Test
  void arrivalExceptionRequiresTenantAdminAndAppliedEvidenceAndKeepsItsOwnIdentity() {
    when(company.requireCompanyUser()).thenReturn(user);
    assertThatThrownBy(() -> service.confirmArrivalException(ride.getId(), new ArrivalException(1L, "Guardian phone unavailable; arrival verified by dispatch."))).isInstanceOf(ApiException.class);
    var admin = new AuthenticatedUser(102L, ride.getTenantId(), "admin@example.test", "Tenant", "Admin", "", true, true, false, List.of(new SimpleGrantedAuthority("ROLE_TENANT_ADMIN")));
    when(company.requireCompanyUser()).thenReturn(admin);
    stops(); stage("ARRIVED", null); stage("PICKED_UP", "100"); stage("DROPPED_OFF", "110");
    long drop = service.companySummary(ride.getId()).milestones().stream().filter(m -> m.milestone().equals("DROPPED_OFF")).findFirst().orElseThrow().id();
    assertThatThrownBy(() -> service.confirmArrivalException(ride.getId(), new ArrivalException(drop + 1, "Guardian unavailable; arrival verified by telephone."))).isInstanceOf(ApiException.class);
    var result = service.confirmArrivalException(ride.getId(), new ArrivalException(drop, "Guardian unavailable; arrival verified by telephone."));
    assertThat(result.readyToComplete()).isTrue();
    assertThat(result.confirmation().subjectType()).isEqualTo("TENANT_ADMIN");
    assertThat(result.confirmation().signed()).isFalse();
    assertThat(service.companySummary(ride.getId()).confirmation().exceptionReason()).contains("arrival verified by telephone");
    assertThat(service.passengerSummary(ride.getId()).confirmation().exceptionReason()).isNull();
    assertThat(db.queryForObject("SELECT exception_reason FROM trip_delivery_confirmations WHERE ride_id=?",String.class,ride.getId())).doesNotContain("Guardian unavailable");
    service.requireComplete(ride);
    verify(notifications).publishArrivalExceptionApproved(ride);
  }

  @Test
  void databaseRejectsEvidenceLinkedAcrossTenants() {
    stops();
    assertThatThrownBy(() -> db.update("UPDATE trip_verified_stops SET tenant_id=? WHERE ride_id=?", UUID.randomUUID().toString(), ride.getId()))
        .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
  }

  @Test
  void operationalReportUsesAppliedMilestonesAndDoesNotInventOnTimeMeasurements() {
    var access=mock(com.transportplatform.tms.features.report.application.ReportAccessService.class);
    when(access.requireReport(com.transportplatform.tms.features.report.domain.ReportType.RIDE)).thenReturn(user);
    var reports=new com.transportplatform.tms.features.report.application.ReportService(access,audit,driverRepository,vehicles,riderRepository,rideRepository,null,null,null,null,null,null,null,clock,mock(com.transportplatform.tms.features.settings.domain.TenantSettingsRepository.class));
    org.springframework.test.util.ReflectionTestUtils.setField(reports,"jdbc",db);
    ride.setScheduledPickupAt(LocalDateTime.ofInstant(clock.instant().minusSeconds(600),ZoneOffset.UTC));
    ride.setScheduledDropoffAt(LocalDateTime.ofInstant(clock.instant().plusSeconds(3000),ZoneOffset.UTC));
    rideRepository.saveAndFlush(ride);
    var missing=reports.runRideReport("",null,null,null,null,null,null);
    assertThat(missing.rows().getFirst().actualPickupAt()).isNull();
    assertThat(missing.summary().stream().filter(m -> m.key().equals("onTimePickupPercent")).findFirst().orElseThrow().value()).isEqualTo("N/A");
    stops();stage("ARRIVED",null);stage("PICKED_UP","100");
    clock.time=clock.time.plusSeconds(3600);
    var dropFix = gps(42.01, -71.01, 10.0, clock.instant());
    // JPA auditing uses wall time; simulate the server receiving this fix at the advanced test clock.
    db.update("UPDATE driver_location_snapshots SET created_at=? WHERE id=?", LocalDateTime.ofInstant(clock.instant(),ZoneOffset.UTC), dropFix.getId());
    service.capture(ride.getId(),new Capture("DROPPED_OFF",new BigDecimal("110"),false));
    service.requireMilestone(ride,"DROPPED_OFF");
    ride.setStatus(RideStatus.DROPPED_OFF);rideRepository.saveAndFlush(ride);
    var report=reports.runRideReport("",null,null,null,null,null,null);
    var row=report.rows().getFirst();
    assertThat(row.pickupDelayMinutes()).isEqualTo(10);
    assertThat(row.dropoffDelayMinutes()).isEqualTo(10);
    assertThat(row.passengerMiles()).isEqualByComparingTo("10");
    assertThat(row.passengerMinutes()).isEqualTo(60);
    assertThat(report.summary().stream().filter(m -> m.key().equals("onTimePickupPercent")).findFirst().orElseThrow().value()).isEqualTo("0.0");
  }

  @Test
  void enforcesCoordinatesAndFreshEvidenceForEveryPath() {
    assertThatThrownBy(() -> service.requireDepartureReady(ride)).isInstanceOf(ApiException.class);
    stops();
    service.requireDepartureReady(ride);
    assertThatThrownBy(() -> service.requireMilestone(ride, "ARRIVED"))
        .isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> service.capture(ride.getId(), new Capture("ARRIVED", null, false)))
        .isInstanceOf(ApiException.class);
  }

  @Test
  void rejectsRemoteStaleFutureInaccurateAndMockedFixes() {
    stops();
    gps(40, -70, 10.0, clock.instant());
    assertThatThrownBy(() -> service.capture(ride.getId(), new Capture("ARRIVED", null, false)))
        .isInstanceOf(ApiException.class);
    snapshots.deleteAll();
    snapshots.flush();
    gps(42, -71, 10.0, clock.instant().minusSeconds(91));
    assertThatThrownBy(() -> service.capture(ride.getId(), new Capture("ARRIVED", null, false)))
        .isInstanceOf(ApiException.class);
    snapshots.deleteAll();
    snapshots.flush();
    gps(42, -71, 10.0, clock.instant().plusSeconds(11));
    assertThatThrownBy(() -> service.capture(ride.getId(), new Capture("ARRIVED", null, false)))
        .isInstanceOf(ApiException.class);
    snapshots.deleteAll();
    snapshots.flush();
    gps(42, -71, 51.0, clock.instant());
    assertThatThrownBy(() -> service.capture(ride.getId(), new Capture("ARRIVED", null, false)))
        .isInstanceOf(ApiException.class);
    snapshots.deleteAll();
    snapshots.flush();
    gps(42, -71, 10.0, clock.instant());
    assertThatThrownBy(() -> service.capture(ride.getId(), new Capture("ARRIVED", null, true)))
        .isInstanceOf(ApiException.class);
  }

  @Test
  void optionalSignatureIsValidatedEncryptedAndNeverReturnedAsRawInk() {
    stops();
    stage("ARRIVED", null);
    stage("PICKED_UP", "100.0");
    stage("DROPPED_OFF", "105.5");
    long drop = service.passengerSummary(ride.getId()).milestones().getLast().id();
    assertThatThrownBy(() -> service.confirm(ride.getId(),
        new Confirmation(drop, true, new Signature(List.of(List.of(new Point(Double.NaN, 0)))))))
        .isInstanceOf(ApiException.class);
    var signature = new Signature(List.of(List.of(new Point(0.1, 0.2), new Point(0.8, 0.7))));
    var result = service.confirm(ride.getId(), new Confirmation(drop, true, signature));
    assertThat(result.confirmation().signed()).isTrue();
    var stored = db.queryForObject("SELECT signature_json FROM trip_delivery_confirmations WHERE ride_id=?", String.class, ride.getId());
    assertThat(stored).isNotNull().doesNotContain("strokes").doesNotContain("0.8");
    assertThat(service.confirm(ride.getId(), new Confirmation(drop, true)).confirmation().signed()).isTrue();
  }

  @Test
  void completedRideNeedsIndependentPassengerConfirmationAndSnapshotBinding() {
    stops();
    stage("ARRIVED", null);
    stage("PICKED_UP", "100.0");
    stage("DROPPED_OFF", "105.5");
    assertThatThrownBy(() -> service.requireComplete(ride)).isInstanceOf(ApiException.class);
    var summary = service.passengerSummary(ride.getId());
    assertThat(summary.canConfirm()).isTrue();
    long drop = summary.milestones().getLast().id();
    assertThatThrownBy(() -> service.confirm(ride.getId(), new Confirmation(drop + 1, true)))
        .isInstanceOf(ApiException.class);
    service.confirm(ride.getId(), new Confirmation(drop, true));
    service.confirm(ride.getId(), new Confirmation(drop, true));
    assertThat(service.driverSummary(ride.getId()).readyToComplete()).isTrue();
    assertThatThrownBy(() -> service.requireBillable(ride)).isInstanceOf(ApiException.class);
    ride.setStatus(RideStatus.COMPLETED);
    service.requireBillable(ride);
    assertThat(
            db.queryForObject(
                "SELECT COUNT(*) FROM trip_delivery_confirmations WHERE ride_id=?",
                Integer.class,
                ride.getId()))
        .isEqualTo(1);
    ride.setDriverId(driver.getId() + 1);
    assertThatThrownBy(() -> service.requireComplete(ride)).isInstanceOf(ApiException.class);
  }

  @Test
  void rejectsOdometerRegressionPrematureConfirmationAndRepeatedConsumption() {
    stops();
    assertThatThrownBy(() -> service.confirm(ride.getId(), new Confirmation(1L, true)))
        .isInstanceOf(ApiException.class);
    stage("ARRIVED", null);
    assertThatThrownBy(() -> service.requireMilestone(ride, "ARRIVED"))
        .isInstanceOf(ApiException.class);
    gps(42, -71, 10.0, clock.instant());
    assertThatThrownBy(() -> service.capture(ride.getId(), new Capture("PICKED_UP", null, false)))
        .isInstanceOf(ApiException.class);
    stage("PICKED_UP", "100");
    gps(42.01, -71.01, 10.0, clock.instant());
    assertThatThrownBy(
            () ->
                service.capture(
                    ride.getId(), new Capture("DROPPED_OFF", new BigDecimal("99"), false)))
        .isInstanceOf(ApiException.class);
  }

  @Test
  void stopAddressChangesInvalidateEvidenceAndStopsLockAfterCapture() {
    stops();
    ride.setPickupAddressLine1("Different address");
    assertThatThrownBy(() -> service.requireDepartureReady(ride)).isInstanceOf(ApiException.class);
    ride.setPickupAddressLine1("1 Pickup Street");
    stage("ARRIVED", null);
    assertThatThrownBy(() -> service.configure(ride.getId(), new Stops(42.0, -71.0, 42.01, -71.01)))
        .isInstanceOf(ApiException.class);
  }

  @Test
  void rejectsUnrelatedPassengerCrossTenantAndDriverConfirmers() {
    stops();
    stage("ARRIVED", null);
    stage("PICKED_UP", "100");
    stage("DROPPED_OFF", "105");
    long drop = service.passengerSummary(ride.getId()).milestones().getLast().id();
    var other = mock(Rider.class);
    when(other.getId()).thenReturn(999L);
    when(passenger.resolveCurrentScope())
        .thenReturn(
            new RiderGuardianPortalAccessService.ResolvedRiderGuardianScope(
                user, PortalSubjectType.RIDER, other, null, List.of(), List.of(other)));
    assertThatThrownBy(() -> service.confirm(ride.getId(), new Confirmation(drop, true)))
        .isInstanceOf(ApiException.class);
    var otherTenant =
        new AuthenticatedUser(
            102L,
            "other-tenant",
            "other@example.test",
            "Other",
            "Rider",
            "",
            true,
            true,
            false,
            List.of(new SimpleGrantedAuthority("ROLE_RIDER")));
    when(passenger.resolveCurrentScope())
        .thenReturn(
            new RiderGuardianPortalAccessService.ResolvedRiderGuardianScope(
                otherTenant,
                PortalSubjectType.RIDER,
                ride.getRider(),
                null,
                List.of(),
                List.of(ride.getRider())));
    assertThatThrownBy(() -> service.confirm(ride.getId(), new Confirmation(drop, true)))
        .isInstanceOf(ApiException.class);
    var dual =
        new AuthenticatedUser(
            101L,
            ride.getTenantId(),
            "driver@example.test",
            "Driver",
            "User",
            "",
            true,
            true,
            false,
            List.of(
                new SimpleGrantedAuthority("ROLE_RIDER"),
                new SimpleGrantedAuthority("ROLE_DRIVER")));
    when(passenger.resolveCurrentScope())
        .thenReturn(
            new RiderGuardianPortalAccessService.ResolvedRiderGuardianScope(
                dual,
                PortalSubjectType.RIDER,
                ride.getRider(),
                null,
                List.of(),
                List.of(ride.getRider())));
    assertThatThrownBy(() -> service.confirm(ride.getId(), new Confirmation(drop, true)))
        .isInstanceOf(ApiException.class);
  }

  @Test
  void onlyActiveScopedGuardianAuthorizedForPickupCanConfirmDelivery() {
    stops();
    stage("ARRIVED", null);
    stage("PICKED_UP", "100");
    stage("DROPPED_OFF", "105");
    long drop = service.passengerSummary(ride.getId()).milestones().getLast().id();
    var guardian = mock(Guardian.class);
    when(guardian.getId()).thenReturn(55L);
    var link = mock(RiderGuardian.class);
    when(link.getRider()).thenReturn(ride.getRider());
    when(passenger.resolveCurrentScope())
        .thenReturn(
            new RiderGuardianPortalAccessService.ResolvedRiderGuardianScope(
                user,
                PortalSubjectType.GUARDIAN,
                null,
                guardian,
                List.of(link),
                List.of(ride.getRider())));
    assertThatThrownBy(() -> service.confirm(ride.getId(), new Confirmation(drop, true)))
        .isInstanceOf(ApiException.class);
    when(link.isAuthorizedForPickup()).thenReturn(true);
    service.confirm(ride.getId(), new Confirmation(drop, true));
    assertThat(service.driverSummary(ride.getId()).confirmation().subjectType())
        .isEqualTo("GUARDIAN");
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
    var vehicle = new com.transportplatform.tms.features.vehicle.domain.Vehicle();
    vehicle.setTenantId(tenantId);
    vehicle.setVehicleCode("QA-" + UUID.randomUUID());
    vehicle.setOwnershipType(
        com.transportplatform.tms.features.vehicle.domain.VehicleOwnershipType.COMPANY_OWNED);
    vehicle.setMake("Ford");
    vehicle.setModel("Transit");
    vehicle.setYear(2024);
    vehicle.setPlateNumber(UUID.randomUUID().toString().substring(0, 8));
    vehicle.setPlateState("IL");
    vehicle.setCapacity(6);
    vehicle.setStatus(com.transportplatform.tms.features.vehicle.domain.VehicleStatus.ACTIVE);
    ride.setVehicleId(vehicles.saveAndFlush(vehicle).getId());
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
