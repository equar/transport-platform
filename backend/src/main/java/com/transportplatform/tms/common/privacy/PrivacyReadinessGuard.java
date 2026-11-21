package com.transportplatform.tms.common.privacy;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class PrivacyReadinessGuard implements ApplicationRunner {
  private final PhiCipher crypto;
  private final JdbcTemplate db;
  private final Environment env;

  public PrivacyReadinessGuard(PhiCipher crypto, JdbcTemplate db, Environment env) {
    this.crypto = crypto;
    this.db = db;
    this.env = env;
  }

  public void run(ApplicationArguments args) {
    if (crypto.legacyAllowed()) {
      if (env.matchesProfiles("prod"))
        throw new IllegalStateException(
            "Legacy sensitive-data reads cannot be enabled in production.");
      return;
    }
    if (db.queryForList(
            "SELECT id FROM privacy_protection_state WHERE id=1 AND inventory_hash=?",
            PrivacyMaintenanceCommand.inventoryHash())
        .isEmpty())
      throw new IllegalStateException(
          "Sensitive-data maintenance has not completed. Keep application traffic stopped and run"
              + " privacy-maintenance.sh --apply with the configured key ring.");
  }
}
