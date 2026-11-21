package com.transportplatform.tms.common.privacy;

import static org.assertj.core.api.Assertions.*;

import com.transportplatform.tms.common.config.SchedulingConfiguration;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.scheduling.annotation.ScheduledAnnotationBeanPostProcessor;

class SchedulingIsolationTest {
  private final ApplicationContextRunner runner =
      new ApplicationContextRunner().withUserConfiguration(SchedulingConfiguration.class);

  @Test
  void runtimeSchedulingIsEnabledByDefault() {
    runner.run(
        context -> assertThat(context).hasSingleBean(ScheduledAnnotationBeanPostProcessor.class));
  }

  @Test
  void explicitTestIsolationDisablesTimers() {
    runner
        .withPropertyValues("app.scheduling.enabled=false")
        .run(
            context ->
                assertThat(context).doesNotHaveBean(ScheduledAnnotationBeanPostProcessor.class));
  }
}
