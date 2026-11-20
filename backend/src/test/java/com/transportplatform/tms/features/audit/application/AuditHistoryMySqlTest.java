package com.transportplatform.tms.features.audit.application;

import static org.assertj.core.api.Assertions.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.transportplatform.tms.common.audit.JpaAuditConfig;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.features.audit.domain.*;
import com.transportplatform.tms.features.tenant.domain.*;
import java.util.List;
import jakarta.persistence.EntityManager;
import com.transportplatform.tms.features.rider.domain.*;
import com.transportplatform.tms.features.ride.domain.*;
import com.transportplatform.tms.features.ride.application.*;
import com.transportplatform.tms.features.organization.domain.ServiceType;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.any;

import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.*;

@DataJpaTest(properties = "spring.flyway.enabled=true")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(JpaAuditConfig.class)
@Testcontainers
class AuditHistoryMySqlTest {
 @Container static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.0.45");
 @DynamicPropertySource static void database(DynamicPropertyRegistry r) {
  r.add("spring.datasource.url", MYSQL::getJdbcUrl); r.add("spring.datasource.username", MYSQL::getUsername); r.add("spring.datasource.password", MYSQL::getPassword);
 }
 @Autowired AuditLogRepository logs;
 @Autowired TenantRepository tenants;
 @Autowired EntityManager em;
 @Autowired RideRepository rides;
 AuditLogService service;
 @BeforeEach void setup() {
  tenant("history-a"); tenant("history-b");
  var user = new AuthenticatedUser(1L,"history-a","admin@example.test","Admin","","",true,true,false,List.of(new SimpleGrantedAuthority("ROLE_TENANT_ADMIN")));
  SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(user,null,user.getAuthorities()));
  service = new AuditLogService(logs,new ObjectMapper());
 }
 @AfterEach void clear() { SecurityContextHolder.clearContext(); }
 void tenant(String id) {
  Tenant t=new Tenant(); t.setId(id);t.setTenantCode(id);t.setCompanyName(id);t.setLegalName(id);t.setEmail(id+"@example.test");t.setPhone("5551234567");t.setAddressLine1("1 Main St");t.setCity("Boston");t.setState("MA");t.setZipCode("02110");t.setCountry("US");t.setBusinessType("TRANSPORT");t.setSubscriptionPlan("STARTER");t.setStatus(TenantStatus.ACTIVE);tenants.saveAndFlush(t);
 }
 void event(String tenant,String type,String id,String oldJson,String newJson) {
  AuditLog a=new AuditLog();a.setTenantId(tenant);a.setModule(type);a.setAction("UPDATED");a.setEntityType(type);a.setEntityId(id);a.setSummary(type+" changed");a.setOldValueJson(oldJson);a.setNewValueJson(newJson);logs.saveAndFlush(a);
 }
 @Test void historyIncludesDirectAndRelatedOldAndNewOwnersWithoutCrossTenantOrSubstringMatches() {
  event("history-a","DRIVER","7",null,null);
  event("history-a","DRIVER_DOCUMENT","99",null,"{\"driverId\":7}");
  event("history-a","RIDE","9","{\"driverId\":7}","{\"driverId\":8}");
  event("history-a","DRIVER_DOCUMENT","100",null,"{\"driverId\":70}");
  event("history-b","DRIVER","7",null,null);
  event("history-a","DRIVER_DOCUMENT","101","legacy detail unavailable","not-json");
  var first=service.search("","","",null,null,0,2,"DRIVER","7");
  assertThat(first.totalElements()).isEqualTo(3);
  assertThat(first.items()).hasSize(2).allMatch(row->row.tenantId().equals("history-a"));
  var second=service.search("","","",null,null,1,2,"DRIVER","7");
  assertThat(second.items()).hasSize(1);
  assertThat(second.items().getFirst().id()).isNotIn(first.items().stream().map(row->row.id()).toList());
 }
 @Test void relationshipHistoryIncludesRemovedLinksAndRequiresCompleteFilter() {
  event("history-a","RIDER_GUARDIAN","30","{\"guardianId\":20,\"riderId\":5}","{\"guardianId\":20,\"riderId\":5,\"status\":\"INACTIVE\"}");
  assertThat(service.search("","","",null,null,0,10,"GUARDIAN","20").totalElements()).isEqualTo(1);
  assertThat(service.search("","","",null,null,0,10,"RIDER","5").totalElements()).isEqualTo(1);
  assertThatThrownBy(()->service.search("","","",null,null,0,10,"RIDER",null)).isInstanceOf(com.transportplatform.tms.common.exception.ApiException.class);
 }

 Rider rider(String tenant, String code) {
  Rider r=new Rider();r.setTenantId(tenant);r.setRiderCode(code);r.setFirstName(code);r.setLastName("Rider");r.setPrimaryPhone("5551234567");r.setRiderType(RiderType.STUDENT);r.setStatus(RiderStatus.ACTIVE);em.persist(r);return r;
 }
 Ride ride(String tenant,String code,Rider rider) {
  Ride r=new Ride();r.setTenantId(tenant);r.setRideNumber(code);r.setRider(rider);r.setServiceType(ServiceType.GENERAL_TRANSPORT);r.setTripType(RideTripType.ONE_WAY);r.setStatus(RideStatus.COMPLETED);
  r.setPickupAddressLine1("1 Main St");r.setPickupCity("Boston");r.setPickupState("MA");r.setPickupZipCode("02110");r.setPickupCountry("US");r.setDropoffAddressLine1("2 Main St");r.setDropoffCity("Boston");r.setDropoffState("MA");r.setDropoffZipCode("02110");r.setDropoffCountry("US");r.setScheduledPickupAt(java.time.LocalDateTime.of(2026,11,20,12,0));em.persist(r);return r;
 }
 @Test void rideHistoryIsTenantScopedPaginatedAndIncludesAGuardiansLinkedRiders() {
  Rider a=rider("history-a","A"), other=rider("history-a","OTHER"), b=rider("history-b","B");
  Ride first=ride("history-a","TRIP-A1",a);ride("history-a","TRIP-A2",a);ride("history-a","TRIP-OTHER",other);ride("history-b","TRIP-B",b);
  Guardian guardian=new Guardian();guardian.setTenantId("history-a");guardian.setFirstName("Guardian");guardian.setLastName("A");guardian.setPhone("5551234567");guardian.setStatus(GuardianStatus.ACTIVE);em.persist(guardian);
  RiderGuardian link=new RiderGuardian();link.setTenantId("history-a");link.setRider(a);link.setGuardian(guardian);link.setRelationshipType(RiderGuardianRelationshipType.PARENT);link.setStatus(RiderGuardianStatus.ACTIVE);em.persist(link);em.flush();
  var access=mock(RideAccessService.class);when(access.requireCompanyTenantId()).thenReturn("history-a");
  var mapper=mock(RideMapper.class);
  when(mapper.toResponse(any())).thenAnswer(invocation->{Ride r=invocation.getArgument(0);var response=mock(com.transportplatform.tms.features.ride.api.response.RideResponse.class);when(response.id()).thenReturn(r.getId());return response;});
  var rideService=new RideService(rides,access,null,mapper,null,null,null,null,java.time.Clock.systemUTC(),null,null,null);
  var page=rideService.searchSubjectRides("RIDER",a.getId(),0,1);
  assertThat(page.totalElements()).isEqualTo(2);
  assertThat(rideService.searchSubjectRides("RIDER",a.getId(),1,1).items().getFirst().id()).isNotEqualTo(page.items().getFirst().id());
  assertThat(rideService.searchSubjectRides("RIDER",b.getId(),0,10).items()).isEmpty();
  assertThat(rideService.searchSubjectRides("GUARDIAN",guardian.getId(),0,10).totalElements()).isEqualTo(2);
  link.setStatus(RiderGuardianStatus.INACTIVE);first.setGuardian(guardian);em.flush();
  assertThat(rideService.searchSubjectRides("GUARDIAN",guardian.getId(),0,10).totalElements()).isEqualTo(1);
  assertThatThrownBy(()->rideService.searchSubjectRides("UNKNOWN",a.getId(),0,10)).isInstanceOf(com.transportplatform.tms.common.exception.ApiException.class);
 }
}
