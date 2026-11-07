package com.transportplatform.tms.features.auth.application;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import org.junit.jupiter.api.Test;
class DeploymentPlatformAdminBootstrapRunnerTest {
    final PlatformAdminBootstrapProperties properties = new PlatformAdminBootstrapProperties();
    final DeploymentPlatformAdminBootstrapService service = mock(DeploymentPlatformAdminBootstrapService.class);
    final DeploymentPlatformAdminBootstrapRunner runner = new DeploymentPlatformAdminBootstrapRunner(properties, service);
    @Test void disabledDoesNothing() { runner.run(null); verifyNoInteractions(service); }
    @Test void validatesAllAddressesBeforeCreatingAny() {
        properties.setEmailEnabled(true); properties.setEmails("apps@bakaroo.com,bad\n@example.com");
        assertThatThrownBy(() -> runner.run(null)).isInstanceOf(IllegalArgumentException.class);
        verifyNoInteractions(service);
    }
    @Test void normalizesAndDeduplicatesTheTwoAddresses() {
        properties.setEmailEnabled(true);
        properties.setEmails(" Apps@bakaroo.com ,equarhishe@gmail.com,apps@bakaroo.com");
        runner.run(null);
        verify(service).bootstrap("apps@bakaroo.com"); verify(service).bootstrap("equarhishe@gmail.com");
        verifyNoMoreInteractions(service);
    }
    @Test void rejectsSimultaneousLegacyBootstrap() {
        properties.setEmailEnabled(true); properties.setEnabled(true);
        assertThatThrownBy(() -> runner.run(null)).isInstanceOf(IllegalStateException.class);
        verifyNoInteractions(service);
    }
    @Test void loggingProviderCannotCreateCredentialWithoutDelivery() {
        var users = mock(com.transportplatform.tms.features.auth.domain.AppUserRepository.class);
        var bootstrap = new DeploymentPlatformAdminBootstrapService(users, null, null, java.time.Clock.systemUTC(),
                true, "logging", "https://admin.example.test/reset-password");
        assertThatThrownBy(() -> bootstrap.bootstrap("apps@bakaroo.com")).isInstanceOf(IllegalStateException.class);
        verify(users, never()).saveAndFlush(any());
    }
}
