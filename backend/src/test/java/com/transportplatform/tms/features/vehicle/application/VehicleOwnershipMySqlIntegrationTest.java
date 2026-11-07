package com.transportplatform.tms.features.vehicle.application;
import static org.assertj.core.api.Assertions.*;
import com.transportplatform.tms.common.audit.JpaAuditConfig;
import com.transportplatform.tms.features.driver.domain.*;
import com.transportplatform.tms.features.tenant.domain.*;
import com.transportplatform.tms.features.vehicle.domain.*;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.*;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.*;
@DataJpaTest(properties="spring.flyway.enabled=true")
@AutoConfigureTestDatabase(replace=AutoConfigureTestDatabase.Replace.NONE)
@Import(JpaAuditConfig.class)
@Testcontainers
class VehicleOwnershipMySqlIntegrationTest {
    @Container static final MySQLContainer<?> MYSQL=new MySQLContainer<>("mysql:8.0.45");
    @DynamicPropertySource static void db(DynamicPropertyRegistry r) {r.add("spring.datasource.url",MYSQL::getJdbcUrl);r.add("spring.datasource.username",MYSQL::getUsername);r.add("spring.datasource.password",MYSQL::getPassword);}
    @Autowired TenantRepository tenants;@Autowired DriverRepository drivers;@Autowired VehicleRepository vehicles;@Autowired JdbcTemplate jdbc;
    String tenant() {
        var t=new Tenant();t.setId(UUID.randomUUID().toString());t.setTenantCode("QA-"+UUID.randomUUID());t.setCompanyName("Ownership test");t.setLegalName("QA-"+UUID.randomUUID());t.setEmail("qa@example.test");t.setPhone("5550100");t.setAddressLine1("1 Test Lane");t.setCity("City");t.setState("State");t.setZipCode("10000");t.setCountry("US");t.setBusinessType("Transport");t.setSubscriptionPlan("STANDARD");t.setStatus(TenantStatus.ACTIVE);return tenants.saveAndFlush(t).getId();
    }
    Driver driver(String tenant) {var d=new Driver();d.setTenantId(tenant);d.setDriverCode("QA-"+UUID.randomUUID());d.setFirstName("Taylor");d.setLastName("Driver");d.setPhone("5550100");d.setDriverType(DriverType.EMPLOYEE);d.setStatus(DriverStatus.ACTIVE);d.setBackgroundCheckStatus(DriverQualificationStatus.CLEAR);d.setDrugTestStatus(DriverQualificationStatus.CLEAR);d.setTrainingStatus(DriverTrainingStatus.COMPLETED);return drivers.saveAndFlush(d);}
    Vehicle vehicle(String tenant,Long owner,Long assigned) {var v=new Vehicle();v.setTenantId(tenant);v.setVehicleCode("QA-"+UUID.randomUUID());v.setOwnershipType(owner==null?VehicleOwnershipType.COMPANY_OWNED:VehicleOwnershipType.DRIVER_OWNED);v.setOwnerDriverId(owner);v.setAssignedDriverId(assigned);v.setMake("Ford");v.setModel("Transit");v.setYear(2024);v.setPlateNumber(UUID.randomUUID().toString().substring(0,8));v.setPlateState("MA");v.setCapacity(6);v.setStatus(VehicleStatus.ACTIVE);return vehicles.saveAndFlush(v);}
    @Test void driverListingIncludesOnlyItsTenantAndItsOwnedOrAssignedVehicles() {
        String a=tenant(),b=tenant();var one=driver(a);var two=driver(a);
        var owned=vehicle(a,one.getId(),two.getId());var assigned=vehicle(a,null,one.getId());
        vehicle(a,two.getId(),two.getId());vehicle(b,null,one.getId());
        assertThat(vehicles.findAllForDriver(a,one.getId())).extracting(Vehicle::getId).containsExactlyInAnyOrder(owned.getId(),assigned.getId());
    }
    @Test void databaseRejectsCrossTenantOwnerEvenIfServiceIsBypassed() {
        String a=tenant(),b=tenant();var foreign=driver(b);var v=vehicle(a,null,null);
        assertThatThrownBy(()->jdbc.update("UPDATE vehicles SET ownership_type='DRIVER_OWNED',owner_driver_id=? WHERE id=?",foreign.getId(),v.getId())).isInstanceOf(DataIntegrityViolationException.class);
    }
}
