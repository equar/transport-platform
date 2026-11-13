package com.transportplatform.tms.features.readiness;

import static org.junit.jupiter.api.Assertions.*;
import com.fasterxml.jackson.databind.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import org.springframework.test.context.*;
import org.springframework.test.context.jdbc.Sql;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.*;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT, properties={
    "app.bootstrap.platform-admin.enabled=false", "app.email.enabled=false", "app.push.enabled=false",
    "app.security.jwt.secret=isolated-workflow-tests-only-secret-12345678901234567890",
    "app.security.auth-rate-limit.login-max-requests=100",
    "app.security.mfa-encryption-key=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="})
@ActiveProfiles("dev")
@Testcontainers
@Sql("/review/compliance-fixture.sql")
class ProductionWorkflowMySqlTest {
    @Container static final MySQLContainer<?> MYSQL=new MySQLContainer<>("mysql:8.0.45").withUrlParam("connectTimeout", "10000").withUrlParam("socketTimeout", "15000");
    @DynamicPropertySource static void database(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url",MYSQL::getJdbcUrl);r.add("spring.datasource.username",MYSQL::getUsername);r.add("spring.datasource.password",MYSQL::getPassword);
    }
    @Autowired TestRestTemplate http;
    @org.springframework.boot.test.web.server.LocalServerPort int port;
    @BeforeEach void boundedHttpClient() {
        var factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000); factory.setReadTimeout(15000);
        http.getRestTemplate().setRequestFactory(factory);
    }
    @Autowired ObjectMapper mapper;
    @Autowired org.springframework.jdbc.core.JdbcTemplate jdbc;
    @Autowired com.transportplatform.tms.features.billing.application.PortalInvoiceTotals totals;
    private ResponseEntity<JsonNode> call(HttpMethod method,String path,Object body,String token,Map<String,String> extra) {
        HttpHeaders headers=new HttpHeaders();headers.setContentType(MediaType.APPLICATION_JSON);
        if(token!=null)headers.setBearerAuth(token);extra.forEach(headers::set);
        return http.exchange("http://"+System.getProperty("transport.test.host","localhost")+":"+port+"/api"+path,method,new HttpEntity<>(body,headers),JsonNode.class);
    }
    private String login(String role) {
        var r=call(HttpMethod.POST,"/v1/auth/login",Map.of("email",role+"@demo.test","password","Password123"),null,
                Map.of("X-Client-Platform",Set.of("driver","rider","guardian").contains(role)?"mobile":"web"));
        assertEquals(200,r.getStatusCode().value(),r.toString());return r.getBody().path("data").path("accessToken").asText();
    }
    @Test void ledgerAggregatesAllInvoicesSeparatelyByCurrencyAndScope() {
        String tenant=jdbc.queryForObject("SELECT tenant_id FROM invoices WHERE id=1",String.class);
        var rows=new ArrayList<Object[]>();
        for(int i=0;i<1002;i++) rows.add(new Object[]{tenant,"AGG-"+i,i==1001?"CAD":"USD"});
        jdbc.batchUpdate("""
            INSERT INTO invoices (tenant_id,invoice_number,bill_to_type,bill_to_id,bill_to_name_snapshot,rider_id,
                invoice_date,due_date,subtotal,tax_amount,discount_amount,total_amount,amount_paid,balance_due,
                currency,status,created_by,created_at,updated_by,updated_at)
            VALUES (?,?,'RIDER',1,'Aggregate test',1,CURRENT_DATE,CURRENT_DATE,1,0,0,1,0,1,?,'ISSUED','test',NOW(),'test',NOW())
            """,rows);
        try {
            var result=totals.calculate(tenant,1L,null,List.of(),null);
            assertTrue(result.count()>=1002);
            assertTrue(result.balances().get("USD").compareTo(BigDecimal.valueOf(1001))>=0);
            assertTrue(result.balances().get("CAD").compareTo(BigDecimal.ONE)>=0);
            assertEquals(BigDecimal.ZERO,result.singleCurrencyBalance());
            assertEquals(0,totals.calculate(tenant,999999L,null,List.of(),null).count());
        } finally { jdbc.update("DELETE FROM invoices WHERE tenant_id=? AND invoice_number LIKE 'AGG-%'",tenant); }
    }
    @Test void simultaneousDistinctPaymentsPreserveEveryDollar() throws Exception {
        String token=login("billing");List<Long> ids=new ArrayList<>();
        for(int i=0;i<4;i++) {
            var r=call(HttpMethod.POST,"/company/payments",Map.of("invoiceId",1,"amount",1,"paymentDate",LocalDate.now().toString(),"paymentMethod","CASH","applyImmediately",false),token,Map.of("Idempotency-Key",UUID.randomUUID().toString()));
            assertEquals(201,r.getStatusCode().value(),r.toString());ids.add(r.getBody().path("data").path("id").asLong());
        }
        BigDecimal before=call(HttpMethod.GET,"/company/invoices/1",null,token,Map.of()).getBody().path("data").path("amountPaid").decimalValue();
        var barrier=new CyclicBarrier(4);
        try(var executor=Executors.newFixedThreadPool(4)) {
            var work=ids.stream().map(id -> executor.submit(() -> {barrier.await(10,TimeUnit.SECONDS);return call(HttpMethod.POST,"/company/payments/"+id+"/apply",Map.of(),token,Map.of());})).toList();
            for(var future:work)assertEquals(200,future.get(30,TimeUnit.SECONDS).getStatusCode().value());
        }
        BigDecimal after=call(HttpMethod.GET,"/company/invoices/1",null,token,Map.of()).getBody().path("data").path("amountPaid").decimalValue();
        assertEquals(0,before.add(BigDecimal.valueOf(4)).compareTo(after));
        var replay=call(HttpMethod.POST,"/company/payments/"+ids.getFirst()+"/apply",Map.of(),token,Map.of());
        assertTrue(replay.getStatusCode().is4xxClientError());
    }
    @Test void authenticatorEnrollmentIssuesSingleUseRecoveryAndRevokesOldSessions() throws Exception {
        String token=login("tenant.admin");
        var setup=call(HttpMethod.POST,"/v1/auth/mfa/setup",Map.of("password","Password123"),token,Map.of());
        assertEquals(200,setup.getStatusCode().value(),setup.toString());
        String secret=setup.getBody().path("data").path("secret").asText();
        byte[] key=decodeBase32(secret);javax.crypto.Mac mac=javax.crypto.Mac.getInstance("HmacSHA1");
        mac.init(new javax.crypto.spec.SecretKeySpec(key,"HmacSHA1"));
        byte[] hash=mac.doFinal(java.nio.ByteBuffer.allocate(8).putLong(java.time.Instant.now().getEpochSecond()/30).array());
        int offset=hash[19]&15;int number=java.nio.ByteBuffer.wrap(hash,offset,4).getInt()&0x7fffffff;
        String code=String.format(java.util.Locale.ROOT,"%06d",number%1000000);
        var activated=call(HttpMethod.POST,"/v1/auth/mfa/activate",Map.of("password","Password123","code",code),token,Map.of());
        assertEquals(200,activated.getStatusCode().value(),activated.toString());
        var recovery=activated.getBody().path("data").path("recoveryCodes");assertEquals(8,recovery.size());
        assertEquals(401,call(HttpMethod.GET,"/company/rides",null,token,Map.of()).getStatusCode().value());
        var proof=new HashMap<String,Object>();proof.put("email","tenant.admin@demo.test");proof.put("password","Password123");
        assertEquals(401,call(HttpMethod.POST,"/v1/auth/login",proof,null,Map.of()).getStatusCode().value());
        proof.put("mfaCode",recovery.get(0).asText());
        var signedIn=call(HttpMethod.POST,"/v1/auth/login",proof,null,Map.of());assertEquals(200,signedIn.getStatusCode().value(),signedIn.toString());
        assertEquals(401,call(HttpMethod.POST,"/v1/auth/login",proof,null,Map.of()).getStatusCode().value());
        String next=signedIn.getBody().path("data").path("accessToken").asText();
        assertEquals(200,call(HttpMethod.POST,"/v1/auth/mfa/disable",Map.of("password","Password123","code",recovery.get(1).asText()),next,Map.of()).getStatusCode().value());
        assertFalse(login("tenant.admin").isBlank());
    }
    private static byte[] decodeBase32(String value) {
        java.io.ByteArrayOutputStream out=new java.io.ByteArrayOutputStream();int buffer=0,bits=0;
        for(char c:value.toCharArray()){buffer=(buffer<<5)|"ABCDEFGHIJKLMNOPQRSTUVWXYZ234567".indexOf(c);bits+=5;if(bits>=8){bits-=8;out.write((buffer>>bits)&255);}}
        return out.toByteArray();
    }
    @Test void optionalAddressesAndProtocolErrorsAreHandled() {
        String token=login("organization");
        assertEquals(200,call(HttpMethod.GET,"/portal/organization/profile",null,token,Map.of()).getStatusCode().value());
        assertEquals(200,call(HttpMethod.GET,"/portal/organization/rides",null,token,Map.of()).getStatusCode().value());
        assertEquals(404,call(HttpMethod.GET,"/does-not-exist",null,token,Map.of()).getStatusCode().value());
    }
    @Test void roundTripCreatesIndependentReturnAndRejectsStaleEdits() {
        String token=login("tenant.admin");
        var source=call(HttpMethod.GET,"/company/rides/2",null,token,Map.of()).getBody().path("data");
        var payload=mapper.convertValue(source,new com.fasterxml.jackson.core.type.TypeReference<Map<String,Object>>(){});
        String day=LocalDate.now().plusDays(20).toString();
        payload.put("tripType","ROUND_TRIP");payload.put("status","SCHEDULED");
        payload.put("scheduledPickupAt",day+"T12:00:00");payload.put("scheduledDropoffAt",day+"T13:00:00");
        payload.put("returnPickupAt",day+"T15:00:00");payload.put("returnDropoffAt",day+"T16:00:00");
        var created=call(HttpMethod.POST,"/company/rides",payload,token,Map.of());assertEquals(201,created.getStatusCode().value(),created.toString());
        var outbound=created.getBody().path("data");long id=outbound.path("id").asLong();long backId=outbound.path("linkedRideId").asLong();
        assertTrue(backId>0);assertEquals("OUTBOUND",outbound.path("journeyLeg").asText());assertEquals("ONE_WAY",outbound.path("tripType").asText());
        var back=call(HttpMethod.GET,"/company/rides/"+backId,null,token,Map.of()).getBody().path("data");
        assertEquals(id,back.path("linkedRideId").asLong());assertEquals("RETURN",back.path("journeyLeg").asText());
        assertEquals(outbound.path("pickupAddressLine1"),back.path("dropoffAddressLine1"));assertEquals(day+"T15:00:00",back.path("scheduledPickupAt").asText());
        payload=mapper.convertValue(outbound,new com.fasterxml.jackson.core.type.TypeReference<Map<String,Object>>(){});
        String version=outbound.path("version").asText();payload.put("internalNotes","Operator A");
        assertEquals(200,call(HttpMethod.PUT,"/company/rides/"+id,payload,token,Map.of("If-Match",version)).getStatusCode().value());
        payload.put("internalNotes","Stale operator B");
        assertEquals(409,call(HttpMethod.PUT,"/company/rides/"+id,payload,token,Map.of("If-Match",version)).getStatusCode().value());
        assertEquals("SCHEDULED",call(HttpMethod.GET,"/company/rides/"+backId,null,token,Map.of()).getBody().path("data").path("status").asText());
        for (long leg : new long[]{id,backId}) {
            var assigned=call(HttpMethod.POST,"/company/rides/"+leg+"/assign-resources",Map.of("driverId",1,"vehicleId",1),token,Map.of());
            assertEquals(200,assigned.getStatusCode().value(),assigned.toString());
            for(String action:List.of("driver-en-route","arrived","picked-up","dropped-off","complete")) {
                var milestone=call(HttpMethod.POST,"/company/rides/"+leg+"/"+action,Map.of(),token,Map.of());
                assertEquals(200,milestone.getStatusCode().value(),action+": "+milestone);
            }
            if(leg==id) assertEquals("SCHEDULED",call(HttpMethod.GET,"/company/rides/"+backId,null,token,Map.of()).getBody().path("data").path("status").asText());
        }
        assertEquals("COMPLETED",call(HttpMethod.GET,"/company/rides/"+backId,null,token,Map.of()).getBody().path("data").path("status").asText());
    }
}
