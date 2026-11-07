package com.transportplatform.tms.features.auth.application;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import com.transportplatform.tms.common.audit.JpaAuditConfig;
import com.transportplatform.tms.features.auth.domain.*;
import com.transportplatform.tms.features.notification.application.NotificationEmailSender;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.*;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.*;

@DataJpaTest(properties = {"spring.flyway.enabled=true", "app.email.enabled=true", "app.email.provider=microsoft-graph", "app.auth.password-reset-base-url=https://admin.transport.example.test/reset-password"})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({JpaAuditConfig.class, DeploymentPlatformAdminBootstrapService.class, DeploymentPlatformAdminBootstrapMySqlIntegrationTest.Config.class})
@Testcontainers
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class DeploymentPlatformAdminBootstrapMySqlIntegrationTest {
    @Container static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.0.45");
    @DynamicPropertySource static void database(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", MYSQL::getJdbcUrl);
        r.add("spring.datasource.username", MYSQL::getUsername);
        r.add("spring.datasource.password", MYSQL::getPassword);
    }
    @TestConfiguration static class Config {
        @Bean Clock clock() { return Clock.fixed(Instant.parse("2026-11-06T12:00:00Z"), ZoneOffset.UTC); }
    }
    @Autowired DeploymentPlatformAdminBootstrapService service;
    @Autowired AppUserRepository users;
    @Autowired com.transportplatform.tms.features.tenant.domain.TenantRepository tenants;
    @MockitoBean PasswordEncoder encoder;
    @MockitoBean NotificationEmailSender mail;
    @BeforeEach void prepare() {
        when(encoder.encode(anyString())).thenReturn("encoded-password");
        when(mail.send(any())).thenReturn(new NotificationEmailSender.DeliveryResult(true, null));
    }
    @Test void createsIndependentGlobalAdminsWithExpiringPasswordsAndSkipsReruns() {
        String a = "admin-a-"+UUID.randomUUID()+"@example.test";
        String b = "admin-b-"+UUID.randomUUID()+"@example.test";
        assertThat(service.bootstrap(" " + a.toUpperCase(Locale.ROOT) + " ")).isTrue();
        assertThat(service.bootstrap(b)).isTrue();
        assertThat(service.bootstrap(a)).isFalse();
        var admin = users.findForAuthenticationByEmail(a).orElseThrow();
        assertThat(admin.getTenantId()).isNull();
        assertThat(admin.getRoles()).containsExactly(RoleName.ROLE_PLATFORM_ADMIN);
        assertThat(admin.isActiveForLogin()).isTrue();
        assertThat(admin.isMustChangePassword()).isTrue();
        assertThat(admin.getPasswordHash()).isEqualTo("encoded-password");
        assertThat(admin.getTemporaryPasswordExpiresAt()).isEqualTo(Instant.parse("2026-11-07T12:00:00Z"));
        assertThat(admin.isTemporaryPasswordExpired(Instant.parse("2026-11-07T12:00:00Z"))).isTrue();
        var passwords = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(encoder, times(2)).encode(passwords.capture());
        assertThat(passwords.getAllValues()).doesNotHaveDuplicates().allMatch(value -> value.matches("(?:[A-Z][a-z]{3}-){6}[2-9]{4}"));
        var deliveries = org.mockito.ArgumentCaptor.forClass(NotificationEmailSender.NotificationEmailCommand.class);
        verify(mail, times(2)).send(deliveries.capture());
        assertThat(deliveries.getAllValues()).extracting(NotificationEmailSender.NotificationEmailCommand::recipientEmail).containsExactly(a,b);
        assertThat(deliveries.getAllValues().getFirst().body()).contains("https://admin.transport.example.test/login", passwords.getAllValues().getFirst());
    }
    @Test void deliveryFailureRollsBackAndCanRetryWithoutLeakingProviderError() {
        String email = "retry-"+UUID.randomUUID()+"@example.test";
        when(mail.send(any())).thenThrow(new RuntimeException("SECRET-MAIL-CONTENT"));
        assertThatThrownBy(() -> service.bootstrap(email)).isInstanceOf(IllegalStateException.class)
                .hasMessageNotContaining("SECRET-MAIL-CONTENT").hasNoCause();
        assertThat(users.findForAuthenticationByEmail(email)).isEmpty();
        doReturn(new NotificationEmailSender.DeliveryResult(true,null)).when(mail).send(any());
        assertThat(service.bootstrap(email)).isTrue();
    }
    @Test void unsuccessfulDeliveryResultAlsoRollsBack() {
        String email = "failure-"+UUID.randomUUID()+"@example.test";
        when(mail.send(any())).thenReturn(new NotificationEmailSender.DeliveryResult(false,"provider detail"));
        assertThatThrownBy(() -> service.bootstrap(email)).isInstanceOf(IllegalStateException.class);
        assertThat(users.findForAuthenticationByEmail(email)).isEmpty();
    }
    @Test void existingNonAdminIsNeverPromotedResetOrEmailed() {
        var tenant = new com.transportplatform.tms.features.tenant.domain.Tenant();
        tenant.setId(UUID.randomUUID().toString()); tenant.setTenantCode("code-"+UUID.randomUUID());
        tenant.setCompanyName("Existing company"); tenant.setLegalName("Existing company");
        tenant.setEmail("company@example.test"); tenant.setPhone("555-0100"); tenant.setAddressLine1("1 Test Way");
        tenant.setCity("City"); tenant.setState("State"); tenant.setZipCode("10000"); tenant.setCountry("US");
        tenant.setBusinessType("Transportation"); tenant.setSubscriptionPlan("STANDARD");
        tenant.setStatus(com.transportplatform.tms.features.tenant.domain.TenantStatus.ACTIVE);
        tenants.saveAndFlush(tenant);
        AppUser user = new AppUser();
        user.setEmail("existing-"+UUID.randomUUID()+"@example.test");
        user.setTenantId(tenant.getId()); user.setRoles(Set.of(RoleName.ROLE_RIDER));
        user.setPasswordHash("original-hash"); user.setStatus(UserStatus.SUSPENDED);
        users.saveAndFlush(user);
        assertThat(service.bootstrap(user.getEmail())).isFalse();
        AppUser unchanged = users.findForAuthenticationByEmail(user.getEmail()).orElseThrow();
        assertThat(unchanged.getRoles()).containsExactly(RoleName.ROLE_RIDER);
        assertThat(unchanged.getPasswordHash()).isEqualTo("original-hash");
        assertThat(unchanged.getStatus()).isEqualTo(UserStatus.SUSPENDED);
        verify(mail, never()).send(any());
    }
}
