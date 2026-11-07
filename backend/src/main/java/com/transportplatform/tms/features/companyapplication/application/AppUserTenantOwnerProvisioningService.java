package com.transportplatform.tms.features.companyapplication.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.auth.domain.AppUser;
import com.transportplatform.tms.features.auth.domain.AppUserRepository;
import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.auth.domain.UserStatus;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AppUserTenantOwnerProvisioningService implements TenantOwnerProvisioningService {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    public AppUserTenantOwnerProvisioningService(AppUserRepository appUserRepository, PasswordEncoder passwordEncoder) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public Long provisionOwner(String tenantId, String ownerEmail, String temporaryPassword) {
        if (appUserRepository.existsByEmailIgnoreCase(ownerEmail)) {
            throw new ApiException(
                    ErrorCode.RESOURCE_CONFLICT,
                    HttpStatus.CONFLICT,
                    "An account already exists for the provided email.");
        }

        AppUser user = new AppUser();
        user.setTenantId(tenantId);
        user.setEmail(ownerEmail.trim().toLowerCase());
        user.setFirstName("Company");
        user.setLastName("Administrator");
        if (temporaryPassword == null || temporaryPassword.isBlank()) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "A temporary password is required for the tenant owner account.");
        }
        user.setPasswordHash(passwordEncoder.encode(temporaryPassword));
        user.setStatus(UserStatus.ACTIVE);
        user.setRoles(Set.of(RoleName.ROLE_TENANT_ADMIN));
        return appUserRepository.save(user).getId();
    }
}
