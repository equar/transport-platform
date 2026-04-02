package com.transportplatform.tms.features.companyapplication.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.transportplatform.tms.features.auth.application.AuthFacade;
import com.transportplatform.tms.features.auth.domain.AppUser;
import com.transportplatform.tms.features.auth.domain.AppUserRepository;
import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.auth.domain.UserStatus;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class AppUserTenantOwnerProvisioningServiceTest {

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthFacade authFacade;

    @Test
    void provisionOwnerCreatesInvitedTenantAdminAndSendsInvitation() {
        AppUserTenantOwnerProvisioningService service = new AppUserTenantOwnerProvisioningService(
                appUserRepository,
                passwordEncoder,
                authFacade);

        when(passwordEncoder.encode(any(String.class))).thenReturn("generated-password");
        when(appUserRepository.save(any(AppUser.class))).thenAnswer(invocation -> {
            AppUser saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 25L);
            return saved;
        });

        Long userId = service.provisionOwner("tenant-123", "owner@example.com");

        ArgumentCaptor<AppUser> userCaptor = ArgumentCaptor.forClass(AppUser.class);
        verify(appUserRepository).save(userCaptor.capture());
        verify(authFacade).sendInvitation(userCaptor.getValue(), null);
        assertEquals(25L, userId);
        assertEquals("tenant-123", userCaptor.getValue().getTenantId());
        assertEquals("owner@example.com", userCaptor.getValue().getEmail());
        assertEquals(UserStatus.INVITED, userCaptor.getValue().getStatus());
        assertEquals(Set.of(RoleName.ROLE_TENANT_ADMIN), userCaptor.getValue().getRoles());
    }
}