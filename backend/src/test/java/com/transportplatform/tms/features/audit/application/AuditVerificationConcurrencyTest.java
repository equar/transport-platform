package com.transportplatform.tms.features.audit.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.transportplatform.tms.common.privacy.PhiCipher;
import com.transportplatform.tms.common.security.AuthenticatedUser;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.*;

class AuditVerificationConcurrencyTest {
    @Test
    @SuppressWarnings("unchecked")
    void aConcurrentCommitAfterTheReadSnapshotIsNotReportedAsDatabaseRollback() throws Exception {
        var db = mock(JdbcTemplate.class);
        var service = new AuditIntegrityService(db, mock(PhiCipher.class), new ObjectMapper());
        var remembered = (Map<String, Object>) ReflectionTestUtils.getField(service, "remembered");
        var constructor =
                Class.forName(AuditIntegrityService.class.getName() + "$Checkpoint")
                        .getDeclaredConstructor(long.class, String.class);
        constructor.setAccessible(true);
        Object newer = constructor.newInstance(1L, "1".repeat(64));
        when(db.queryForList("SELECT * FROM audit_integrity_heads WHERE scope_key=?", "tenant"))
                .thenAnswer(
                        call -> {
                            // Simulate an append committing after this verifier's consistent
                            // snapshot was taken.
                            remembered.put("tenant", newer);
                            return List.of();
                        });
        when(db.queryForObject(anyString(), eq(Long.class), any(Object[].class))).thenReturn(0L);
        var user =
                new AuthenticatedUser(
                        1L,
                        "tenant",
                        "admin",
                        "A",
                        "B",
                        "",
                        true,
                        true,
                        false,
                        List.of(new SimpleGrantedAuthority("ROLE_TENANT_ADMIN")));
        SecurityContextHolder.getContext()
                .setAuthentication(
                        new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities()));
        try {
            assertThat(service.verify("tenant", 0, null, null).issues())
                    .doesNotContain("PROCESS_CHECKPOINT_ROLLBACK");
        } finally {
            SecurityContextHolder.clearContext();
        }
    }
}
