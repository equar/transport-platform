package com.transportplatform.tms.features.companyapplication.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.auth.application.AuthFacade;
import com.transportplatform.tms.features.auth.domain.AppUser;
import com.transportplatform.tms.features.auth.domain.AppUserRepository;
import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.auth.domain.UserStatus;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AppUserTenantOwnerProvisioningService implements TenantOwnerProvisioningService {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthFacade authFacade;

    public AppUserTenantOwnerProvisioningService(AppUserRepository appUserRepository,
            PasswordEncoder passwordEncoder,
            AuthFacade authFacade) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.authFacade = authFacade;
    }

    @Override
    @Transactional
    public Long provisionOwner(String tenantId, String ownerEmail) {
        if (appUserRepository.existsForTenantAndEmail(tenantId, ownerEmail)) {
            throw new ApiException(
                    ErrorCode.RESOURCE_CONFLICT,
                    HttpStatus.CONFLICT,
                    "A tenant owner account already exists for the provided email.");
        }

        AppUser user = new AppUser();
        user.setTenantId(tenantId);
        user.setEmail(ownerEmail.trim().toLowerCase());
        user.setFirstName("Company");
        user.setLastName("Administrator");
        user.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
        user.setStatus(UserStatus.INVITED);
        user.setRoles(Set.of(RoleName.ROLE_TENANT_ADMIN));
        AppUser saved = appUserRepository.save(user);
        authFacade.sendInvitation(saved, null);
        return saved.getId();
    }
}
