package com.transportplatform.tms.common.privacy;

import static org.assertj.core.api.Assertions.*;

import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationVersion;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.*;
import org.springframework.core.io.support.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.*;

@Testcontainers
class InterruptedV24MigrationMySqlTest {
  @Container static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.0.45");

  @Test
  void resumesTheActualCollationFailureWithoutDroppingExistingDataOrRepairingOtherHistory()
      throws Exception {
    var source =
        new DriverManagerDataSource(MYSQL.getJdbcUrl(), MYSQL.getUsername(), MYSQL.getPassword());
    var db = new JdbcTemplate(source);
    db.execute("ALTER DATABASE `test` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    migration("16").migrate();
    String seed =
        new ClassPathResource("db/devdata/R__realistic_demo_data.sql")
            .getContentAsString(StandardCharsets.UTF_8);
    try (var c = source.getConnection()) {
      c.createStatement().execute("SET collation_connection='utf8mb4_unicode_ci'");
      ScriptUtils.executeSqlScript(
          c,
          new EncodedResource(
              new ByteArrayResource(
                  seed.substring(0, seed.indexOf("-- Development entitlement fixture"))
                      .getBytes(StandardCharsets.UTF_8)),
              StandardCharsets.UTF_8));
    }
    db.update(
        "INSERT INTO"
            + " driver_earnings_ledger(tenant_id,driver_id,ride_id,entry_type,status,amount,currency,created_by,updated_by,updated_at)"
            + " VALUES('demo-metro-mobility-000000000001',1,1,'EARNED','EARNED',25,'USD','fixture','fixture',NOW())");
    migration("23").migrate();
    // A legacy schema retained unicode_ci while new connections/database defaults became
    // 0900_ai_ci.
    db.execute("ALTER DATABASE `test` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci");
    Path directory = Files.createTempDirectory("original-v24-");
    try {
      for (var resource :
          new PathMatchingResourcePatternResolver().getResources("classpath:db/migration/*.sql"))
        try (var input = resource.getInputStream()) {
          Files.copy(input, directory.resolve(resource.getFilename()));
        }
      Files.copy(
          new ClassPathResource("review/v24-before-collation-fix.sql").getInputStream(),
          directory.resolve("V24__medium_review_integrity.sql"),
          StandardCopyOption.REPLACE_EXISTING);
      var original =
          Flyway.configure().dataSource(source).locations("filesystem:" + directory).load();
      assertThatThrownBy(original::migrate).hasStackTraceContaining("Illegal mix of collations");
      assertThat(
              db.queryForObject(
                  "SELECT COUNT(*) FROM flyway_schema_history WHERE version='24' AND success=FALSE",
                  Integer.class))
          .isEqualTo(1);
      assertThat(
              db.queryForObject(
                  "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE()"
                      + " AND table_name='driver_earnings_ledger' AND"
                      + " column_name='source_invoice_id'",
                  Integer.class))
          .isEqualTo(1);
      PrivacyMaintenanceCommand.resumeFailedV24(
          MYSQL.getJdbcUrl(), MYSQL.getUsername(), MYSQL.getPassword());
      migration(null).migrate();
      assertThat(
              db.queryForObject(
                  "SELECT COUNT(*) FROM flyway_schema_history WHERE version='24' AND success=TRUE",
                  Integer.class))
          .isEqualTo(1);
      assertThat(
              db.queryForObject(
                  "SELECT amount FROM driver_earnings_ledger WHERE ride_id=1",
                  java.math.BigDecimal.class))
          .isEqualByComparingTo("25.00");
      assertThat(
              db.queryForObject(
                  "SELECT status FROM driver_earnings_ledger WHERE ride_id=1", String.class))
          .isEqualTo("PENDING_REVIEW");
      assertThat(
              db.queryForObject(
                  "SELECT collation_name FROM information_schema.columns WHERE"
                      + " table_schema=DATABASE() AND table_name='credit_notes' AND"
                      + " column_name='tenant_id'",
                  String.class))
          .isEqualTo("utf8mb4_unicode_ci");
      // Replaying the resumable statements must neither duplicate reviews nor overwrite amounts.
      try (var c = source.getConnection()) {
        ScriptUtils.executeSqlScript(
            c, new ClassPathResource("db/migration/V24__medium_review_integrity.sql"));
      }
      assertThat(db.queryForObject("SELECT COUNT(*) FROM earnings_legacy_reviews", Integer.class))
          .isEqualTo(1);
      db.update("UPDATE flyway_schema_history SET success=FALSE WHERE version='23'");
      assertThatThrownBy(
              () ->
                  PrivacyMaintenanceCommand.resumeFailedV24(
                      MYSQL.getJdbcUrl(), MYSQL.getUsername(), MYSQL.getPassword()))
          .hasMessageContaining("different failed migration");
      assertThat(
              db.queryForObject(
                  "SELECT COUNT(*) FROM flyway_schema_history WHERE version='23' AND success=FALSE",
                  Integer.class))
          .isEqualTo(1);
    } finally {
      try (var files = Files.walk(directory)) {
        for (var path : files.sorted(Comparator.reverseOrder()).toList()) Files.delete(path);
      }
    }
  }

  private Flyway migration(String target) {
    var config =
        Flyway.configure()
            .dataSource(MYSQL.getJdbcUrl(), MYSQL.getUsername(), MYSQL.getPassword())
            .locations("classpath:db/migration");
    if (target != null) config.target(MigrationVersion.fromVersion(target));
    return config.load();
  }
}
