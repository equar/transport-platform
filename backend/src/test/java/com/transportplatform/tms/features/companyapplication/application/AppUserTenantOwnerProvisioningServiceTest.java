package com.transportplatform.tms.features.companyapplication.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.transportplatform.tms.features.auth.domain.AppUser;
import com.transportplatform.tms.features.auth.domain.AppUserRepository;
import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.auth.domain.UserStatus;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AppUserTenantOwnerProvisioningServiceTest {

    @Mock AppUserRepository appUserRepository;
    @Mock PasswordEncoder passwordEncoder;
    @InjectMocks AppUserTenantOwnerProvisioningService service;

    @Test
    void provisionsActiveOwnerWithProvidedTemporaryPassword() {
        when(passwordEncoder.encode("Temporary123!")).thenReturn("encoded");
        when(appUserRepository.save(any(AppUser.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.provisionOwner("tenant-1", " Owner@Example.com ", "Temporary123!");

        ArgumentCaptor<AppUser> captor = ArgumentCaptor.forClass(AppUser.class);
        verify(appUserRepository).save(captor.capture());
        AppUser owner = captor.getValue();
        assertEquals("tenant-1", owner.getTenantId());
        assertEquals("owner@example.com", owner.getEmail());
        assertEquals("encoded", owner.getPasswordHash());
        assertEquals(UserStatus.ACTIVE, owner.getStatus());
        assertEquals(java.util.Set.of(RoleName.ROLE_TENANT_ADMIN), owner.getRoles());
    }
}
