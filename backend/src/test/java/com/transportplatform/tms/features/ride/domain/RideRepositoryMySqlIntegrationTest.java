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
        tenantRepository.saveAndFlush(tenant);

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