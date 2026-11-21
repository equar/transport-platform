package com.transportplatform.tms.common.privacy;

import static com.transportplatform.tms.features.privacy.api.PrivacyRetentionRecords.*;
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
import com.transportplatform.tms.features.location.domain.*;
import com.transportplatform.tms.features.organization.domain.ServiceType;
import com.transportplatform.tms.features.privacy.application.PrivacyRetentionService;
import com.transportplatform.tms.features.ride.domain.Ride;
import com.transportplatform.tms.features.ride.domain.RideRepository;
import com.transportplatform.tms.features.ride.domain.RideStatus;
import com.transportplatform.tms.features.ride.domain.RideTripType;
import com.transportplatform.tms.features.rider.domain.*;
import com.transportplatform.tms.features.rider.domain.Rider;
import com.transportplatform.tms.features.rider.domain.RiderRepository;
import com.transportplatform.tms.features.rider.domain.RiderStatus;
import com.transportplatform.tms.features.rider.domain.RiderType;
import com.transportplatform.tms.features.tenant.domain.Tenant;
import com.transportplatform.tms.features.tenant.domain.TenantRepository;
import com.transportplatform.tms.features.tenant.domain.TenantStatus;
import jakarta.persistence.EntityManager;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import javax.sql.DataSource;
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
import org.springframework.transaction.annotation.*;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@DataJpaTest(properties = {"spring.flyway.enabled=true", "spring.jpa.hibernate.ddl-auto=validate"})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({
  JpaAuditConfig.class,
  PrivacyRetentionService.class,
  com.transportplatform.tms.features.audit.application.AuditIntegrityService.class,
  PrivacyMySqlTest.Config.class,
  com.transportplatform.tms.features.subscriptionbilling.application.DriverMeteringListener.class
})
@Testcontainers
class PrivacyMySqlTest {
  @Container static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.0.45");

  @DynamicPropertySource
  static void datasource(DynamicPropertyRegistry r) {
    r.add("spring.datasource.url", MYSQL::getJdbcUrl);
    r.add("spring.datasource.username", MYSQL::getUsername);
    r.add("spring.datasource.password", MYSQL::getPassword);
    r.add("spring.datasource.driver-class-name", MYSQL::getDriverClassName);
  }

  @TestConfiguration
  static class Config {
    @Bean
    com.fasterxml.jackson.databind.ObjectMapper mapper() {
      return new com.fasterxml.jackson.databind.ObjectMapper();
    }

    @Bean
    Clock clock() {
      return Clock.systemUTC();
    }
  }

  @Autowired PhiCipher crypto;
  @Autowired PrivacyRetentionService retention;
  @Autowired JdbcTemplate db;
  @Autowired DataSource dataSource;
  @Autowired EntityManager em;
  @Autowired TenantRepository tenantRepository;
  @Autowired DriverRepository driverRepository;
  @Autowired RiderRepository riderRepository;
  @Autowired RideRepository rideRepository;
  @Autowired com.transportplatform.tms.features.vehicle.domain.VehicleRepository vehicles;
  @MockBean CurrentAuthenticatedUserService users;
  @MockBean AuditLogService audit;
  Ride ride;
  Driver driver;
  String tenant;

  @BeforeEach
  void setup() {
    tenant = UUID.randomUUID().toString();
    driver = saveDriver(tenant);
    ride = saveRide(tenant, driver.getId(), RideStatus.COMPLETED);
    when(users.requireCurrentUser())
        .thenReturn(
            new AuthenticatedUser(
                101L,
                tenant,
                "admin@example.test",
                "Admin",
                "User",
                "",
                true,
                true,
                false,
                List.of(new SimpleGrantedAuthority("ROLE_TENANT_ADMIN"))));
  }

  @Test
  void encryptsClinicalFieldsAndPreservesPhoneAndAccessibilityFilteringAcrossUpdates() {
    var rider = ride.getRider();
    rider.setCareNotesSummary("Oxygen assistance required");
    rider.setDateOfBirth(java.time.LocalDate.of(1960, 1, 2));
    rider.setPrimaryPhone("(555) 123-4567");
    rider.setWheelchairRequired(true);
    rider.setEscortRequired(true);
    rider.setMobilityNeeds(java.util.Set.of(RiderMobilityNeed.OXYGEN));
    riderRepository.saveAndFlush(rider);
    var row =
        db.queryForMap(
            "SELECT"
                + " care_notes_summary,date_of_birth,primary_phone,wheelchair_required,escort_required"
                + " FROM riders WHERE id=?",
            rider.getId());
    for (Object value : row.values()) assertThat(value.toString()).startsWith("phi1.");
    assertThat(
            db.queryForObject(
                "SELECT mobility_need FROM rider_mobility_needs WHERE rider_id=?",
                String.class,
                rider.getId()))
        .startsWith("phi1.");
    em.clear();
    var read = riderRepository.findById(rider.getId()).orElseThrow();
    assertThat(read.getCareNotesSummary()).isEqualTo("Oxygen assistance required");
    assertThat(read.isWheelchairRequired()).isTrue();
    assertThat(read.getDateOfBirth()).isEqualTo(java.time.LocalDate.of(1960, 1, 2));
    assertThat(
            riderRepository.findAll(
                com.transportplatform.tms.features.rider.application.RiderSpecifications.search(
                    tenant, "123-4567", null, null, true, true, crypto)))
        .hasSize(1);
    read.setPrimaryPhone("555-999-0100");
    read.setWheelchairRequired(false);
    riderRepository.saveAndFlush(read);
    em.clear();
    assertThat(
            riderRepository.findAll(
                com.transportplatform.tms.features.rider.application.RiderSpecifications.search(
                    tenant, "1234567", null, null, null, null, crypto)))
        .isEmpty();
    assertThat(
            riderRepository.findAll(
                com.transportplatform.tms.features.rider.application.RiderSpecifications.search(
                    tenant, "9990100", null, null, false, true, crypto)))
        .hasSize(1);
  }

  @Test
  @Transactional(propagation = Propagation.NOT_SUPPORTED)
  void deploymentCommandProtectsOutdatedInventoryAndSkipsAnAlreadyReadyRelease() throws Exception {
    db.update("DELETE FROM privacy_protection_state WHERE id=1");
    try {
      assertThat(maintenanceProcess("--ensure-ready", 0)).contains("PROTECTED ");
      var timestamp =
          db.queryForObject(
              "SELECT protected_at FROM privacy_protection_state WHERE id=1",
              java.time.LocalDateTime.class);
      assertThat(maintenanceProcess("--ensure-ready", 0))
          .contains("Privacy inventory is ready")
          .doesNotContain("PROTECTED ");
      assertThat(
              db.queryForObject(
                  "SELECT protected_at FROM privacy_protection_state WHERE id=1",
                  java.time.LocalDateTime.class))
          .isEqualTo(timestamp);
      assertThat(maintenanceProcess("--check-ready", 0)).contains("Privacy inventory is ready");
      db.update("UPDATE privacy_protection_state SET inventory_hash='outdated' WHERE id=1");
      assertThat(maintenanceProcess("--check-ready", 1)).contains("not ready");
      assertThat(
              db.queryForObject(
                  "SELECT inventory_hash FROM privacy_protection_state WHERE id=1", String.class))
          .isEqualTo("outdated");
    } finally {
      db.update("DELETE FROM privacy_protection_state WHERE id=1");
    }
  }

  private String maintenanceProcess(String mode, int exit) throws Exception {
    var output = java.nio.file.Files.createTempFile("privacy-command-test-", ".log");
    var command =
        new ProcessBuilder(
                System.getProperty("java.home") + "/bin/java",
                "-cp",
                System.getProperty(
                    "surefire.test.class.path", System.getProperty("java.class.path")),
                PrivacyMaintenanceCommand.class.getName(),
                mode)
            .redirectErrorStream(true)
            .redirectOutput(output.toFile());
    var environment = command.environment();
    environment.clear();
    environment.put("TZ", "UTC");
    environment.put("SPRING_DATASOURCE_URL", MYSQL.getJdbcUrl());
    environment.put("SPRING_DATASOURCE_USERNAME", MYSQL.getUsername());
    environment.put("SPRING_DATASOURCE_PASSWORD", MYSQL.getPassword());
    environment.put(
        "APP_PRIVACY_ENCRYPTION_KEYS", "test:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=");
    environment.put("APP_PRIVACY_ACTIVE_KEY_ID", "test");
    environment.put("APP_PRIVACY_LOOKUP_KEY", "AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE=");
    Process process = command.start();
    try {
      assertThat(process.waitFor(45, java.util.concurrent.TimeUnit.SECONDS)).isTrue();
      String result = java.nio.file.Files.readString(output);
      assertThat(process.exitValue()).withFailMessage(result).isEqualTo(exit);
      return result;
    } finally {
      process.destroyForcibly();
      java.nio.file.Files.deleteIfExists(output);
    }
  }

  @Test
  @Transactional(propagation = Propagation.NOT_SUPPORTED)
  void offlineMaintenanceProtectsLegacyRowsAndMinimizesHistoricalAuditWithoutLosingStatus()
      throws Exception {
    long id = ride.getRider().getId();
    db.update(
        "UPDATE riders SET care_notes_summary='legacy oxygen note',primary_phone='555-321-0123'"
            + " WHERE id=?",
        id);
    db.update(
        "INSERT INTO"
            + " audit_logs(tenant_id,module_name,action_name,entity_type,entity_id,summary,old_value_json,new_value_json,created_by,created_at,updated_by,updated_at)"
            + " VALUES(?,'RIDER','UPDATED','RIDER',?,'Patient oxygen note',NULL,?,"
            + " 'test',UTC_TIMESTAMP(6),'test',UTC_TIMESTAMP(6))",
        tenant,
        Long.toString(id),
        "{\"riderId\":"
            + id
            + ",\"status\":\"ACTIVE\",\"careNotesSummary\":\"legacy oxygen note\"}");
    try (var c = dataSource.getConnection()) {
      c.setAutoCommit(false);
      PrivacyMaintenanceCommand.run(c, crypto, false);
    }
    assertThat(
            db.queryForObject("SELECT care_notes_summary FROM riders WHERE id=?", String.class, id))
        .isEqualTo("legacy oxygen note");
    try (var c = dataSource.getConnection()) {
      c.setAutoCommit(false);
      assertThat(PrivacyMaintenanceCommand.ready(c)).isFalse();
      PrivacyMaintenanceCommand.run(c, crypto, true);
      assertThat(PrivacyMaintenanceCommand.ready(c)).isTrue();
      c.prepareStatement("UPDATE privacy_protection_state SET inventory_hash='outdated' WHERE id=1")
          .executeUpdate();
      assertThat(PrivacyMaintenanceCommand.ready(c)).isFalse();
      c.rollback();
    }
    String encrypted =
        db.queryForObject("SELECT care_notes_summary FROM riders WHERE id=?", String.class, id);
    assertThat(encrypted).startsWith("phi1.");
    assertThat(crypto.decrypt(encrypted, "text")).isEqualTo("legacy oxygen note");
    var log =
        db.queryForMap("SELECT summary,new_value_json FROM audit_logs WHERE tenant_id=?", tenant);
    assertThat(log.toString()).doesNotContain("legacy oxygen", "Patient oxygen").contains("ACTIVE");
    assertThat(
            db.queryForObject(
                "SELECT COUNT(*) FROM privacy_protection_state WHERE id=1", Integer.class))
        .isEqualTo(1);
  }

  @Test
  void tenantOverridesInheritAndPlatformLegalHoldWins() {
    retention.save("PLATFORM", new PrivacyRetentionRequest(365, 180, 30, false, false, null));
    retention.save(tenant, new PrivacyRetentionRequest(null, 90, null, true, false, null));
    var policy = retention.view(tenant).effective();
    assertThat(policy.operationalReviewDays()).isEqualTo(365);
    assertThat(policy.auditDays()).isEqualTo(90);
    assertThat(policy.notificationDays()).isEqualTo(30);
    assertThat(policy.cleanupEnabled()).isTrue();
    retention.save("PLATFORM", new PrivacyRetentionRequest(365, 180, 30, true, true, null));
    assertThat(retention.view(tenant).effective().legalHold()).isTrue();
    retention.save(tenant, new PrivacyRetentionRequest(null, 90, null, true, false, null));
    assertThat(retention.view(tenant).effective().legalHold()).isTrue();
  }

  @Test
  void cleanupHonorsLegalHoldsAndNeverCrossesTenantBoundary() {
    String other = UUID.randomUUID().toString();
    saveTenant(other);
    for (String id : List.of(tenant, other))
      db.update(
          "INSERT INTO"
              + " audit_logs(tenant_id,module_name,action_name,entity_type,entity_id,summary,created_by,created_at,updated_by,updated_at)"
              + " VALUES(?,'RIDER','UPDATED','RIDER','1','Update','test',UTC_TIMESTAMP(6)-INTERVAL"
              + " 100 DAY,'test',UTC_TIMESTAMP(6))",
          id);
    retention.save("PLATFORM", new PrivacyRetentionRequest(null, 30, 30, true, true, null));
    retention.save(tenant, new PrivacyRetentionRequest(null, null, null, true, false, null));
    retention.clean(tenant);
    assertThat(
            db.queryForObject(
                "SELECT COUNT(*) FROM audit_logs WHERE tenant_id=?", Integer.class, tenant))
        .isEqualTo(1);
    retention.save("PLATFORM", new PrivacyRetentionRequest(null, 30, 30, true, false, null));
    retention.clean(tenant);
    assertThat(
            db.queryForObject(
                "SELECT COUNT(*) FROM audit_logs WHERE tenant_id=?", Integer.class, tenant))
        .isZero();
    assertThat(
            db.queryForObject(
                "SELECT COUNT(*) FROM audit_logs WHERE tenant_id=?", Integer.class, other))
        .isEqualTo(1);
  }

  @Test
  void recordReviewRetainsPrimaryRecordsAndRespectsReviewInterval() {
    retention.save(tenant, new PrivacyRetentionRequest(30, null, null, false, false, null));
    long id = ride.getRider().getId();
    db.update(
        "UPDATE riders SET status='INACTIVE',updated_at=UTC_TIMESTAMP(6)-INTERVAL 60 DAY WHERE"
            + " id=?",
        id);
    assertThat(retention.reviewCandidates(tenant))
        .anyMatch(c -> c.entityType().equals("RIDER") && c.entityId() == id);
    retention.review(tenant, new PrivacyReviewRequest("RIDER", id, "LEGAL_RECORDKEEPING"));
    assertThat(retention.reviewCandidates(tenant))
        .noneMatch(c -> c.entityType().equals("RIDER") && c.entityId() == id);
    assertThat(riderRepository.findById(id)).isPresent();
    assertThatThrownBy(
            () ->
                retention.review(
                    UUID.randomUUID().toString(),
                    new PrivacyReviewRequest("RIDER", id, "LEGAL_RECORDKEEPING")))
        .isInstanceOf(ApiException.class);
  }

  @Test
  void notificationCleanupPreservesPendingDeliveryAndOtherTenantRows() {
    var account = new com.transportplatform.tms.features.auth.domain.AppUser();
    account.setTenantId(tenant);
    account.setEmail(UUID.randomUUID() + "@example.test");
    account.setPasswordHash("not-a-real-password");
    account.setStatus(com.transportplatform.tms.features.auth.domain.UserStatus.ACTIVE);
    em.persist(account);
    em.flush();
    for (String status : List.of("SENT", "PENDING"))
      db.update(
          "INSERT INTO"
              + " notifications(tenant_id,notification_code,recipient_user_id,title,message,notification_type,channel,delivery_status,read_status,status,delivery_attempt_count,created_by,created_at,updated_by,updated_at)"
              + " VALUES(?, ?, ?, 'Update', ?,"
              + " 'RIDE_STATUS_CHANGED','IN_APP',?,'UNREAD','ACTIVE',0,'system',UTC_TIMESTAMP(6)-INTERVAL"
              + " 60 DAY,'system',UTC_TIMESTAMP(6))",
          tenant,
          UUID.randomUUID().toString(),
          account.getId(),
          crypto.encrypt("Update", "text"),
          status);
    retention.save(tenant, new PrivacyRetentionRequest(null, null, 30, true, false, null));
    retention.clean(tenant);
    assertThat(
            db.queryForList(
                "SELECT delivery_status FROM notifications WHERE tenant_id=?",
                String.class,
                tenant))
        .containsExactly("PENDING");
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
