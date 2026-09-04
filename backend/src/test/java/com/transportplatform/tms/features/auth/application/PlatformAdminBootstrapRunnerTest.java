package com.transportplatform.tms.features.auth.application;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.transportplatform.tms.features.auth.domain.AppUser;
import com.transportplatform.tms.features.auth.domain.AppUserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class PlatformAdminBootstrapRunnerTest {

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Test
    void existingPlatformAdminDoesNotRequireBootstrapPassword() {
        when(appUserRepository.findForAuthenticationByEmail("samuelweld2018@gmail.com"))
                .thenReturn(Optional.of(new AppUser()));

        assertDoesNotThrow(() -> runner(null).run(null));

        verify(appUserRepository, never()).save(any());
    }

    @Test
    void missingPlatformAdminAcceptsConfiguredPassword() {
        when(appUserRepository.findForAuthenticationByEmail("samuelweld2018@gmail.com"))
                .thenReturn(Optional.empty());

        when(passwordEncoder.encode("Password123")).thenReturn("encoded-password");

        assertDoesNotThrow(() -> runner("Password123").run(null));

        verify(appUserRepository).save(any(AppUser.class));
    }

    private PlatformAdminBootstrapRunner runner(String password) {
        PlatformAdminBootstrapProperties properties = new PlatformAdminBootstrapProperties();
        properties.setEnabled(true);
        properties.setPassword(password);
        return new PlatformAdminBootstrapRunner(properties, appUserRepository, passwordEncoder);
    }
}