package com.transportplatform.tms.features.driverearnings.application;

import static org.assertj.core.api.Assertions.*;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationVersion;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.*;
import org.springframework.core.io.support.EncodedResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.*;

import java.nio.charset.StandardCharsets;

@Testcontainers
class LegacyEarningsMigrationMySqlTest {
    @Container static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.0.45");

    @Test
    void v24QueuesOnlyUnreviewedV17ApprovalsAndKeepsThePriorAmount() throws Exception {
        var source =
                new DriverManagerDataSource(
                        MYSQL.getJdbcUrl(), MYSQL.getUsername(), MYSQL.getPassword());
        migrate("16");
        String demo =
                new ClassPathResource("db/devdata/R__realistic_demo_data.sql")
                        .getContentAsString(StandardCharsets.UTF_8);
        demo = demo.substring(0, demo.indexOf("-- Development entitlement fixture"));
        try (var connection = source.getConnection()) {
            ScriptUtils.executeSqlScript(
                    connection,
                    new EncodedResource(
                            new ByteArrayResource(demo.getBytes(StandardCharsets.UTF_8)),
                            StandardCharsets.UTF_8));
        }
        var db = new JdbcTemplate(source);
        String tenant = "demo-metro-mobility-000000000001";
        db.update(
                "INSERT INTO"
                    + " driver_earnings_ledger(tenant_id,driver_id,ride_id,entry_type,status,amount,currency,created_by,updated_by,updated_at)"
                    + " VALUES(?,1,1,'EARNED','EARNED',25,'USD','fixture','fixture',NOW())",
                tenant);
        long legacy =
                db.queryForObject(
                        "SELECT id FROM driver_earnings_ledger WHERE ride_id=1 AND"
                                + " entry_type='EARNED'",
                        Long.class);
        migrate("23");
        assertThat(
                        db.queryForObject(
                                "SELECT status FROM driver_earnings_ledger WHERE id=?",
                                String.class,
                                legacy))
                .isEqualTo("APPROVED");
        db.update(
                "INSERT INTO"
                    + " driver_earnings_ledger(tenant_id,driver_id,ride_id,entry_type,status,amount,currency,created_by,updated_by,updated_at)"
                    + " VALUES(?,1,2,'EARNED','APPROVED',40,'USD','fixture','fixture',NOW())",
                tenant);
        long reviewed =
                db.queryForObject(
                        "SELECT id FROM driver_earnings_ledger WHERE ride_id=2 AND"
                                + " entry_type='EARNED'",
                        Long.class);
        db.update(
                "INSERT INTO"
                    + " audit_logs(tenant_id,module_name,action_name,entity_type,entity_id,summary,created_by,created_at,updated_by,updated_at)"
                    + " VALUES(?,'DRIVER_EARNINGS','EARNINGS_APPROVED','DRIVER_EARNINGS_LEDGER',?,'Human"
                    + " approval','fixture',NOW(),'fixture',NOW())",
                tenant.toUpperCase(java.util.Locale.ROOT),
                Long.toString(reviewed));
        migrate(null);
        assertThat(
                        db.queryForObject(
                                "SELECT status FROM driver_earnings_ledger WHERE id=?",
                                String.class,
                                legacy))
                .isEqualTo("PENDING_REVIEW");
        assertThat(
                        db.queryForObject(
                                "SELECT previous_amount FROM earnings_legacy_reviews WHERE"
                                        + " ledger_id=?",
                                java.math.BigDecimal.class,
                                legacy))
                .isEqualByComparingTo("25.00");
        assertThat(
                        db.queryForObject(
                                "SELECT status FROM driver_earnings_ledger WHERE id=?",
                                String.class,
                                reviewed))
                .isEqualTo("APPROVED");
        assertThatThrownBy(
                        () ->
                                db.update(
                                        "INSERT INTO"
                                            + " driver_earnings_ledger(tenant_id,driver_id,entry_type,status,amount,currency)"
                                            + " VALUES(?,1,'EARNED','PENDING_REVIEW',1,'USD')",
                                        tenant))
                .isInstanceOf(org.springframework.dao.DataAccessException.class);
    }

    private void migrate(String target) {
        var configuration =
                Flyway.configure()
                        .dataSource(MYSQL.getJdbcUrl(), MYSQL.getUsername(), MYSQL.getPassword())
                        .locations("classpath:db/migration");
        if (target != null) configuration.target(MigrationVersion.fromVersion(target));
        configuration.load().migrate();
    }
}
