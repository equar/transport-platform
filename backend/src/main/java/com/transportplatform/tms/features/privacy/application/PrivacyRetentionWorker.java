package com.transportplatform.tms.features.privacy.application;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class PrivacyRetentionWorker {
  private final PrivacyRetentionService service;

  public PrivacyRetentionWorker(PrivacyRetentionService service) {
    this.service = service;
  }

  @Scheduled(
      fixedDelayString = "${app.privacy.retention.interval-ms:3600000}",
      initialDelayString = "${app.privacy.retention.initial-delay-ms:300000}")
  public void run() {
    service.cleanPlatform();
    long offset = 0;
    while (true) {
      var tenants = service.tenants(offset);
      if (tenants.isEmpty()) break;
      for (String tenant : tenants) {
        try {
          service.clean(tenant);
        } catch (RuntimeException e) {
          org.slf4j.LoggerFactory.getLogger(getClass())
              .warn("Privacy retention cleanup failed; record contents omitted.");
        }
      }
      offset += tenants.size();
    }
  }
}
