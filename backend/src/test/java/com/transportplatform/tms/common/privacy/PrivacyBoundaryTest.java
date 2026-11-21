package com.transportplatform.tms.common.privacy;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.transportplatform.tms.features.audit.application.*;
import com.transportplatform.tms.features.audit.domain.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;

class PrivacyBoundaryTest {
  @Test
  void releaseArtifactCanVerifyCoordinateMappingsWithoutCredentialsOrDatabase() {
    assertThatCode(() -> PrivacyMaintenanceCommand.main(new String[] {"--verify-artifact"}))
        .doesNotThrowAnyException();
  }

  @Test
  void auditServiceDoesNotPersistClinicalSnapshotsOrPersonalActorLabels() {
    var repo = mock(AuditLogRepository.class);
    var service = new AuditLogService(repo, new ObjectMapper());
    org.springframework.test.util.ReflectionTestUtils.setField(
        service, "integrity", mock(AuditIntegrityService.class));
    service.record(
        new AuditLogCommand(
            new AuditLogActor(42L, "patient@example.test", "Private Patient"),
            "tenant-a",
            "RIDER",
            "UPDATED",
            "RIDER",
            "12",
            "Patient needs oxygen",
            Map.of("riderId", 12, "careNotesSummary", "Old care details"),
            Map.of(
                "riderId",
                12,
                "dateOfBirth",
                "1960-01-01",
                "careNotesSummary",
                "Oxygen assistance",
                "status",
                "ACTIVE")));
    var row = ArgumentCaptor.forClass(AuditLog.class);
    verify(repo).saveAndFlush(row.capture());
    assertThat(row.getValue().getNewValueJson())
        .doesNotContain("1960-01-01", "Oxygen assistance")
        .contains("ACTIVE", "REDACTED", "changedFields");
    assertThat(row.getValue().getSummary()).isEqualTo("RIDER record: UPDATED.");
    assertThat(row.getValue().getActorEmail()).isNull();
    assertThat(row.getValue().getActorName()).isEqualTo("User #42");
  }

  @Test
  void financialBasisAndLocationRetentionChangesRemainVisibleWithoutClinicalDetails() {
    var mapper = new ObjectMapper();
    var snapshot =
        PrivacyMinimizer.audit(
                mapper.valueToTree(
                    Map.of(
                        "sourceInvoiceId",
                        7,
                        "locationDays",
                        30,
                        "careNotesSummary",
                        "Private care details")))
            .toString();
    assertThat(snapshot)
        .contains("sourceInvoiceId", "locationDays", "30")
        .doesNotContain("Private care details");
  }

  @Test
  void strictStartupRequiresCompletedInventoryAndRejectsLegacyProductionReads() {
    var crypto = mock(PhiCipher.class);
    var db = mock(JdbcTemplate.class);
    var env = mock(Environment.class);
    var guard = new PrivacyReadinessGuard(crypto, db, env);
    assertThatThrownBy(() -> guard.run(new DefaultApplicationArguments()))
        .isInstanceOf(IllegalStateException.class);
    when(crypto.legacyAllowed()).thenReturn(true);
    when(env.matchesProfiles("prod")).thenReturn(true);
    assertThatThrownBy(() -> guard.run(new DefaultApplicationArguments()))
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("production");
  }
}
