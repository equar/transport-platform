package com.transportplatform.tms.features.auth.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.common.security.JwtClaims;
import com.transportplatform.tms.common.security.JwtService;
import com.transportplatform.tms.features.auth.api.request.ChangePasswordRequest;
import com.transportplatform.tms.features.auth.api.request.LoginRequest;
import com.transportplatform.tms.features.auth.api.request.RefreshTokenRequest;
import com.transportplatform.tms.features.auth.api.response.AuthTokensResponse;
import com.transportplatform.tms.features.auth.domain.AppUser;
import com.transportplatform.tms.features.auth.domain.AppUserRepository;
import com.transportplatform.tms.features.auth.domain.UserStatus;
import io.jsonwebtoken.JwtException;
import java.time.Instant;
import java.util.LinkedHashSet;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthFacade {

    private static final String PLATFORM_TENANT_ALIAS = "platform";

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CurrentAuthenticatedUserService currentAuthenticatedUserService;

    public AuthFacade(AppUserRepository appUserRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            CurrentAuthenticatedUserService currentAuthenticatedUserService) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.currentAuthenticatedUserService = currentAuthenticatedUserService;
    }

    @Transactional
    public AuthTokensResponse login(LoginRequest request) {
        String normalizedTenantId = normalizeTenantId(request.tenantId());
        AppUser user = appUserRepository.findForAuthentication(normalizedTenantId, request.email())
                .orElseThrow(() -> invalidCredentials());

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash()) || !user.isActiveForLogin()) {
            throw invalidCredentials();
        }

        user.setLastLoginAt(Instant.now());

        return issueTokens(toPrincipal(user));
    }

    public AuthTokensResponse refresh(RefreshTokenRequest request) {
        try {
            JwtClaims claims = jwtService.parseRefreshToken(request.refreshToken());
            AppUser user = appUserRepository.findForAuthentication(claims.tenantId(), claims.subject())
                    .orElseThrow(this::invalidCredentials);

            if (!user.isActiveForLogin()) {
                throw invalidCredentials();
            }

            return issueTokens(toPrincipal(user));
        } catch (JwtException exception) {
            throw invalidCredentials();
        }
    }

    @Transactional
    public String changePassword(ChangePasswordRequest request) {
        AuthenticatedUser currentUser = currentAuthenticatedUserService.requireCurrentUser();
        AppUser user = appUserRepository.findById(currentUser.id())
                .orElseThrow(this::invalidCredentials);

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new ApiException(
                    ErrorCode.INVALID_CREDENTIALS,
                    HttpStatus.BAD_REQUEST,
                    "The current password is incorrect.");
        }

        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "The new password must be different from the current password.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        return "Password updated successfully.";
    }

    private AuthTokensResponse issueTokens(AuthenticatedUser user) {
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        return new AuthTokensResponse(
                accessToken,
                refreshToken,
                "Bearer",
                jwtService.parseAccessToken(accessToken).expiresAt().getEpochSecond()
                        - jwtService.parseAccessToken(accessToken).issuedAt().getEpochSecond(),
                new AuthTokensResponse.AuthenticatedUserResponse(
                        user.id(),
                        user.getUsername(),
                        user.firstName(),
                        user.lastName(),
                        user.tenantId(),
                        user.isEnabled() ? UserStatus.ACTIVE.name() : UserStatus.INVITED.name(),
                        user.getAuthorities().stream().map(authority -> authority.getAuthority())
                                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new))));
    }

    private AuthenticatedUser toPrincipal(AppUser user) {
        return new AuthenticatedUser(
                user.getId(),
                user.getTenantId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getPasswordHash(),
                user.isActiveForLogin(),
                user.getStatus() != UserStatus.SUSPENDED,
                user.getRoles().stream().map(role -> new SimpleGrantedAuthority(role.name())).toList());
    }

    private String normalizeTenantId(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            return null;
        }
        return PLATFORM_TENANT_ALIAS.equalsIgnoreCase(tenantId.trim()) ? null : tenantId.trim();
    }

    private ApiException invalidCredentials() {
        return new ApiException(
                ErrorCode.INVALID_CREDENTIALS,
                HttpStatus.UNAUTHORIZED,
                "The provided credentials are invalid.");
    }
}
