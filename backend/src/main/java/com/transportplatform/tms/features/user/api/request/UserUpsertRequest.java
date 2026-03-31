package com.transportplatform.tms.features.user.api.request;

import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.portalaccess.domain.PortalSubjectType;
import com.transportplatform.tms.features.auth.domain.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.util.Set;

public record UserUpsertRequest(
                String tenantId,
                @NotBlank @Size(max = 100) String firstName,
                @NotBlank @Size(max = 100) String lastName,
                @NotBlank @Email @Size(max = 150) String email,
                @Size(min = 8, max = 100) String password,
                UserStatus status,
                @NotEmpty Set<RoleName> roles,
                PortalSubjectType portalSubjectType,
                @Positive Long portalSubjectId) {
}