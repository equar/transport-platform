package com.transportplatform.tms.features.subscriptionbilling.application;

import com.transportplatform.tms.features.driver.domain.Driver;
import jakarta.persistence.PostPersist;
import jakarta.persistence.PostUpdate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/** Uses the current persistence transaction; no separate transaction or elevated DB privileges. */
@Component
public class DriverMeteringListener {
  private final JdbcTemplate db;

  public DriverMeteringListener(JdbcTemplate db) {
    this.db = db;
  }

  @PostPersist
  @PostUpdate
  public void record(Driver driver) {
    var current =
        db.queryForList(
            "SELECT status FROM subscription_driver_status_periods WHERE driver_id=? AND"
                + " effective_to IS NULL",
            String.class,
            driver.getId());
    if (!current.isEmpty() && current.getFirst().equals(driver.getStatus().name())) return;
    var now = db.queryForObject("SELECT UTC_TIMESTAMP(6)", java.time.LocalDateTime.class);
    db.update(
        "UPDATE subscription_driver_status_periods SET effective_to=? WHERE driver_id=? AND"
            + " effective_to IS NULL",
        now,
        driver.getId());
    db.update(
        "INSERT INTO subscription_driver_status_periods(tenant_id,driver_id,status,effective_from)"
            + " VALUES(?,?,?,?)",
        driver.getTenantId(),
        driver.getId(),
        driver.getStatus().name(),
        now);
  }
}
