package com.transportplatform.tms.common.privacy;

import java.util.Map;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

/**
 * Test-classpath only: never encrypt fixtures with CI/deployment secrets inherited from the host.
 */
public final class PrivacyTestEnvironment implements EnvironmentPostProcessor, Ordered {
  @Override
  public int getOrder() {
    return Ordered.LOWEST_PRECEDENCE;
  }

  @Override
  public void postProcessEnvironment(
      ConfigurableEnvironment environment, SpringApplication application) {
    environment
        .getPropertySources()
        .addFirst(
            new MapPropertySource(
                "disposable-privacy-test-keys",
                Map.of(
                    "app.privacy.encryption-keys",
                        "test:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
                    "app.privacy.active-key-id", "test",
                    "app.privacy.lookup-key", "AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE=")));
  }
}
