package com.transportplatform.tms.common.privacy;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;

@Configuration
public class PrivacyConfiguration {
  @Bean
  public PhiCipher phiCipher(
      @Value("${app.privacy.encryption-keys:}") String keys,
      @Value("${app.privacy.active-key-id:}") String active,
      @Value("${app.privacy.lookup-key:}") String lookup,
      @Value("${app.privacy.allow-legacy-reads:false}") boolean legacy) {
    return new PhiCipher(keys, active, lookup, legacy);
  }
}
