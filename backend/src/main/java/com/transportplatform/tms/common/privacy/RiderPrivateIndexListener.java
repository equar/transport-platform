package com.transportplatform.tms.common.privacy;

import com.transportplatform.tms.features.rider.domain.Rider;
import jakarta.persistence.*;
import org.springframework.jdbc.core.JdbcTemplate;

public class RiderPrivateIndexListener {
  private final PhiCipher crypto;
  private final JdbcTemplate db;

  public RiderPrivateIndexListener(PhiCipher crypto, JdbcTemplate db) {
    this.crypto = crypto;
    this.db = db;
  }

  @PrePersist
  @PreUpdate
  public void index(Rider rider) {
    rider.setWheelchairLookup(
        crypto.lookup(
            rider.getTenantId(), "wheelchair", Boolean.toString(rider.isWheelchairRequired())));
    rider.setEscortLookup(
        crypto.lookup(rider.getTenantId(), "escort", Boolean.toString(rider.isEscortRequired())));
  }

  @PostPersist
  @PostUpdate
  public void phoneIndex(Rider rider) {
    db.update("DELETE FROM rider_private_search_tokens WHERE rider_id=?", rider.getId());
    for (String token :
        crypto.phoneTokens(rider.getTenantId(), rider.getPrimaryPhone(), rider.getAlternatePhone()))
      db.update(
          "INSERT INTO rider_private_search_tokens(rider_id,token) VALUES(?,?)",
          rider.getId(),
          token);
  }
}
