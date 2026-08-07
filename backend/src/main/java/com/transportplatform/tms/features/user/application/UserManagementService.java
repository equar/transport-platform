package com.transportplatform.tms.features.user.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.audit.application.AuditLogCommand;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.auth.domain.AppUser;
import com.transportplatform.tms.features.auth.domain.AppUserRepository;
import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.auth.domain.UserStatus;
import com.transportplatform.tms.features.notification.application.NotificationEventService;
import com.transportplatform.tms.features.portalaccess.application.PortalAccessService;
import com.transportplatform.tms.features.portalaccess.domain.PortalSubjectType;
import com.transportplatform.tms.features.portalaccess.domain.PortalUserScopeRepository;
import com.transportplatform.tms.features.driver.domain.DriverRepository;
import com.transportplatform.tms.features.rider.domain.RiderRepository;
import com.transportplatform.tms.features.rider.domain.GuardianRepository;
import com.transportplatform.tms.features.organization.domain.OrganizationContactRepository;
import com.transportplatform.tms.features.user.api.response.PortalSubjectOptionResponse;
import com.transportplatform.tms.features.tenant.domain.TenantRepository;
import com.transportplatform.tms.features.user.api.request.UserUpsertRequest;
import com.transportplatform.tms.features.user.api.response.UserResponse;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserManagementService {

    private final AppUserRepository appUserRepository;
    private final TenantRepository tenantRepository;
    private final PasswordEncoder passwordEncoder;
    private final CurrentAuthenticatedUserService currentAuthenticatedUserService;
    private final AuditLogService auditLogService;
    private final NotificationEventService notificationEventService;
    private final PortalAccessService portalAccessService;
    private final PortalUserScopeRepository portalUserScopeRepository;
    private final DriverRepository driverRepository;
    private final RiderRepository riderRepository;
    private final GuardianRepository guardianRepository;
    private final OrganizationContactRepository organizationContactRepository;

    public UserManagementService(AppUserRepository appUserRepository,
            TenantRepository tenantRepository,
            PasswordEncoder passwordEncoder,
            CurrentAuthenticatedUserService currentAuthenticatedUserService,
            AuditLogService auditLogService,
            NotificationEventService notificationEventService,
            PortalAccessService portalAccessService,
            PortalUserScopeRepository portalUserScopeRepository,
            DriverRepository driverRepository,
            RiderRepository riderRepository,
            GuardianRepository guardianRepository,
            OrganizationContactRepository organizationContactRepository) {
        this.appUserRepository = appUserRepository;
        this.tenantRepository = tenantRepository;
        this.passwordEncoder = passwordEncoder;
        this.currentAuthenticatedUserService = currentAuthenticatedUserService;
        this.auditLogService = auditLogService;
        this.notificationEventService = notificationEventService;
        this.portalAccessService = portalAccessService;
        this.portalUserScopeRepository = portalUserScopeRepository;
        this.driverRepository = driverRepository;
        this.riderRepository = riderRepository;
        this.guardianRepository = guardianRepository;
        this.organizationContactRepository = organizationContactRepository;
    }

    @Transactional(readOnly = true)
    public List<PortalSubjectOptionResponse> listCompanyPortalSubjects(PortalSubjectType type, String keyword) {
        String tenantId = requireCompanyAdminTenantId();
        Set<Long> linkedIds = portalUserScopeRepository.findAllByTenantIdAndPortalSubjectType(tenantId, type).stream()
                .map(scope -> scope.getPortalSubjectId())
                .collect(java.util.stream.Collectors.toSet());

        List<PortalSubjectOptionResponse> options = switch (type) {
            case DRIVER -> driverRepository.findAllByTenantId(tenantId).stream()
                    .map(subject -> new PortalSubjectOptionResponse(
                            subject.getId(), type, displayName(subject.getFirstName(), subject.getLastName()),
                            subject.getFirstName(), subject.getLastName(), subject.getDriverCode(), subject.getEmail(),
                            subject.getStatus().name(), linkedIds.contains(subject.getId())))
                    .toList();
            case RIDER -> riderRepository.findAllByTenantId(tenantId).stream()
                    .map(subject -> new PortalSubjectOptionResponse(
                            subject.getId(), type, displayName(subject.getFirstName(), subject.getLastName()),
                            subject.getFirstName(), subject.getLastName(), subject.getRiderCode(), subject.getEmail(),
                            subject.getStatus().name(), linkedIds.contains(subject.getId())))
                    .toList();
            case GUARDIAN -> guardianRepository.findAllByTenantId(tenantId).stream()
                    .map(subject -> new PortalSubjectOptionResponse(
                            subject.getId(), type, displayName(subject.getFirstName(), subject.getLastName()),
                            subject.getFirstName(), subject.getLastName(), null, subject.getEmail(),
                            subject.getStatus().name(), linkedIds.contains(subject.getId())))
                    .toList();
            case ORGANIZATION_CONTACT -> organizationContactRepository
                    .findAllByTenantIdOrderByLastNameAscFirstNameAsc(tenantId).stream()
                    .map(subject -> new PortalSubjectOptionResponse(
                            subject.getId(), type, displayName(subject.getFirstName(), subject.getLastName()),
                            subject.getFirstName(), subject.getLastName(), subject.getOrganization().getName(),
                            subject.getEmail(), subject.getStatus().name(), linkedIds.contains(subject.getId())))
                    .toList();
        };

        String normalizedKeyword = keyword == null ? "" : keyword.trim().toLowerCase(Locale.ROOT);
        return options.stream()
                .filter(option -> normalizedKeyword.isEmpty()
                        || searchablePortalSubject(option).contains(normalizedKeyword))
                .sorted(Comparator.comparing(PortalSubjectOptionResponse::displayName,
                        String.CASE_INSENSITIVE_ORDER))
                .limit(100)
                .toList();
    }

    private String displayName(String firstName, String lastName) {
        return (firstName + " " + lastName).trim();
    }

    private String searchablePortalSubject(PortalSubjectOptionResponse option) {
        return String.join(" ",
                option.displayName(),
                option.reference() == null ? "" : option.reference(),
                option.email() == null ? "" : option.email())
                .toLowerCase(Locale.ROOT);
    }

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> searchPlatformUsers(String keyword,
            String tenantId,
            UserStatus status,
            RoleName role,
            int page,
            int size) {
        requireRole(RoleName.ROLE_PLATFORM_ADMIN);
        Specification<AppUser> specification = Specification.allOf(
                UserSpecifications.keyword(keyword),
                UserSpecifications.tenantId(tenantId),
                UserSpecifications.status(status),
                UserSpecifications.role(role));
        return PageResponse.from(appUserRepository.findAll(specification,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"))).map(this::toResponse));
    }

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> searchCompanyUsers(String keyword,
            UserStatus status,
            RoleName role,
            int page,
            int size) {
        String tenantId = requireCompanyAdminTenantId();
        Specification<AppUser> specification = Specification.allOf(
                UserSpecifications.keyword(keyword),
                UserSpecifications.tenantId(tenantId),
                UserSpecifications.status(status),
                UserSpecifications.role(role));
        return PageResponse.from(appUserRepository.findAll(specification,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"))).map(this::toResponse));
    }

    @Transactional(readOnly = true)
    public UserResponse getPlatformUser(Long userId) {
        requireRole(RoleName.ROLE_PLATFORM_ADMIN);
        return toResponse(findUser(userId));
    }

    @Transactional(readOnly = true)
    public UserResponse getCompanyUser(Long userId) {
        AppUser user = findUserForCompanyScope(userId);
        return toResponse(user);
    }

    @Transactional
    public UserResponse createPlatformUser(UserUpsertRequest request) {
        requireRole(RoleName.ROLE_PLATFORM_ADMIN);
        AppUser user = new AppUser();
        applyUserValues(user, request, AdminScope.PLATFORM, true);
        AppUser saved = appUserRepository.save(user);
        syncPortalScope(saved, request, true);
        recordUserCreated(saved);
        return toResponse(saved);
    }

    @Transactional
    public UserResponse createCompanyUser(UserUpsertRequest request) {
        requireCompanyAdminTenantId();
        AppUser user = new AppUser();
        applyUserValues(user, request, AdminScope.COMPANY, true);
        AppUser saved = appUserRepository.save(user);
        syncPortalScope(saved, request, true);
        recordUserCreated(saved);
        notificationEventService.publishCompanyUserCreated(saved);
        return toResponse(saved);
    }

    @Transactional
    public UserResponse updatePlatformUser(Long userId, UserUpsertRequest request) {
        requireRole(RoleName.ROLE_PLATFORM_ADMIN);
        AppUser user = findUser(userId);
        var oldSnapshot = snapshot(user);
        Set<RoleName> previousRoles = new LinkedHashSet<>(user.getRoles());
        applyUserValues(user, request, AdminScope.PLATFORM, false);
        AppUser saved = appUserRepository.save(user);
        syncPortalScope(saved, request, false);
        recordUserUpdated(saved, oldSnapshot, previousRoles);
        return toResponse(saved);
    }

    @Transactional
    public UserResponse updateCompanyUser(Long userId, UserUpsertRequest request) {
        AppUser user = findUserForCompanyScope(userId);
        var oldSnapshot = snapshot(user);
        Set<RoleName> previousRoles = new LinkedHashSet<>(user.getRoles());
        applyUserValues(user, request, AdminScope.COMPANY, false);
        AppUser saved = appUserRepository.save(user);
        syncPortalScope(saved, request, false);
        recordUserUpdated(saved, oldSnapshot, previousRoles);
        return toResponse(saved);
    }

    @Transactional
    public UserResponse activatePlatformUser(Long userId) {
        requireRole(RoleName.ROLE_PLATFORM_ADMIN);
        AppUser user = findUser(userId);
        UserStatusWorkflow.ensureCanActivate(user.getStatus());
        return updateStatus(user, UserStatus.ACTIVE);
    }

    @Transactional
    public UserResponse suspendPlatformUser(Long userId) {
        requireRole(RoleName.ROLE_PLATFORM_ADMIN);
        AppUser user = findUser(userId);
        UserStatusWorkflow.ensureCanSuspend(user.getStatus());
        return updateStatus(user, UserStatus.SUSPENDED);
    }

    @Transactional
    public UserResponse deactivatePlatformUser(Long userId) {
        requireRole(RoleName.ROLE_PLATFORM_ADMIN);
        AppUser user = findUser(userId);
        UserStatusWorkflow.ensureCanDeactivate(user.getStatus());
        return updateStatus(user, UserStatus.DEACTIVATED);
    }

    @Transactional
    public UserResponse activateCompanyUser(Long userId) {
        AppUser user = findUserForCompanyScope(userId);
        UserStatusWorkflow.ensureCanActivate(user.getStatus());
        return updateStatus(user, UserStatus.ACTIVE);
    }

    @Transactional
    public UserResponse suspendCompanyUser(Long userId) {
        AppUser user = findUserForCompanyScope(userId);
        UserStatusWorkflow.ensureCanSuspend(user.getStatus());
        return updateStatus(user, UserStatus.SUSPENDED);
    }

    @Transactional
    public UserResponse deactivateCompanyUser(Long userId) {
        AppUser user = findUserForCompanyScope(userId);
        UserStatusWorkflow.ensureCanDeactivate(user.getStatus());
        return updateStatus(user, UserStatus.DEACTIVATED);
    }

    private UserResponse updateStatus(AppUser user, UserStatus status) {
        var oldSnapshot = snapshot(user);
        UserStatus previousStatus = user.getStatus();
        user.setStatus(status);
        AppUser saved = appUserRepository.save(user);
        auditLogService.record(new AuditLogCommand(
                null,
                saved.getTenantId(),
                "USER",
                "STATUS_CHANGED",
                "USER",
                resolveEntityId(saved),
                "User " + saved.getEmail() + " status changed to " + saved.getStatus().name() + ".",
                oldSnapshot,
                snapshot(saved)));
        if (saved.getTenantId() != null) {
            if (previousStatus != UserStatus.ACTIVE && saved.getStatus() == UserStatus.ACTIVE) {
                notificationEventService.publishCompanyUserActivated(saved);
            } else if (saved.getStatus() == UserStatus.SUSPENDED) {
                notificationEventService.publishCompanyUserSuspended(saved);
            }
        }
        return toResponse(saved);
    }

    private void applyUserValues(AppUser user, UserUpsertRequest request, AdminScope scope, boolean creating) {
        String tenantId = resolveTenantId(scope, request.tenantId());
        Set<RoleName> roles = validateRoles(new LinkedHashSet<>(request.roles()), scope, tenantId);
        String normalizedEmail = request.email().trim().toLowerCase();

        if (creating && (request.password() == null || request.password().isBlank())) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "A password is required when creating a user.");
        }

        boolean emailConflict = creating
                ? appUserRepository.existsByEmailIgnoreCase(normalizedEmail)
                : appUserRepository.existsByEmailIgnoreCaseAndIdNot(normalizedEmail, user.getId());
        if (emailConflict) {
            throw new ApiException(
                    ErrorCode.RESOURCE_CONFLICT,
                    HttpStatus.CONFLICT,
                    "A user with the provided email already exists.");
        }

        user.setTenantId(tenantId);
        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setEmail(normalizedEmail);
        user.setRoles(roles);
        user.setStatus(request.status() == null ? UserStatus.ACTIVE : request.status());
        if (request.password() != null && !request.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
        }
    }

    private Set<RoleName> validateRoles(Set<RoleName> roles, AdminScope scope, String tenantId) {
        if (roles.isEmpty()) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "At least one role must be assigned to a user.");
        }

        if (scope == AdminScope.COMPANY && roles.contains(RoleName.ROLE_PLATFORM_ADMIN)) {
            throw new ApiException(
                    ErrorCode.FORBIDDEN,
                    HttpStatus.FORBIDDEN,
                    "Company administrators cannot assign platform roles.");
        }

        if (tenantId == null && !roles.equals(Set.of(RoleName.ROLE_PLATFORM_ADMIN))) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "Platform-scope users can only be assigned the platform administrator role.");
        }

        if (tenantId != null && roles.contains(RoleName.ROLE_PLATFORM_ADMIN)) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "Tenant users cannot be assigned platform administrator privileges.");
        }

        return roles;
    }

    private void syncPortalScope(AppUser user, UserUpsertRequest request, boolean creating) {
        if (user.getTenantId() == null || user.getTenantId().isBlank()) {
            portalAccessService.removeScope(user.getId());
            return;
        }
        if (!containsPortalRole(user.getRoles())) {
            portalAccessService.removeScope(user.getId());
            return;
        }
        if (request.portalSubjectType() == null && request.portalSubjectId() == null) {
            if (creating || portalAccessService.findScope(user.getId()).isEmpty()) {
                throw new ApiException(
                        ErrorCode.VALIDATION_FAILED,
                        HttpStatus.BAD_REQUEST,
                        "A portal identity must be selected for driver, rider, guardian, and organization users.");
            }
            return;
        }
        if (request.portalSubjectType() == null || request.portalSubjectId() == null) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "Both portal subject type and portal subject ID are required.");
        }
        validatePortalScopeCompatibility(user.getRoles(), request.portalSubjectType());
        portalAccessService.upsertScope(user.getId(), user.getTenantId(), request.portalSubjectType(),
                request.portalSubjectId());
    }

    private boolean containsPortalRole(Set<RoleName> roles) {
        return roles.contains(RoleName.ROLE_DRIVER)
                || roles.contains(RoleName.ROLE_RIDER)
                || roles.contains(RoleName.ROLE_GUARDIAN)
                || roles.contains(RoleName.ROLE_ORGANIZATION_USER);
    }

    private void validatePortalScopeCompatibility(Set<RoleName> roles, PortalSubjectType portalSubjectType) {
        boolean valid = switch (portalSubjectType) {
            case DRIVER -> roles.contains(RoleName.ROLE_DRIVER);
            case RIDER -> roles.contains(RoleName.ROLE_RIDER);
            case GUARDIAN -> roles.contains(RoleName.ROLE_GUARDIAN);
            case ORGANIZATION_CONTACT -> roles.contains(RoleName.ROLE_ORGANIZATION_USER);
        };
        if (!valid) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "The selected portal scope type is not compatible with the assigned user roles.");
        }
    }

    private String resolveTenantId(AdminScope scope, String requestedTenantId) {
        if (scope == AdminScope.COMPANY) {
            return requireCompanyAdminTenantId();
        }

        String normalizedTenantId = normalizeTenantId(requestedTenantId);
        if (normalizedTenantId != null && !tenantRepository.existsById(normalizedTenantId)) {
            throw new ApiException(
                    ErrorCode.RESOURCE_NOT_FOUND,
                    HttpStatus.NOT_FOUND,
                    "The specified tenant could not be found.");
        }
        return normalizedTenantId;
    }

    private AppUser findUser(Long userId) {
        return appUserRepository.findById(userId)
                .orElseThrow(() -> new ApiException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        HttpStatus.NOT_FOUND,
                        "The requested user could not be found."));
    }

    private AppUser findUserForCompanyScope(Long userId) {
        String tenantId = requireCompanyAdminTenantId();
        AppUser user = findUser(userId);
        if (!tenantId.equals(user.getTenantId())) {
            throw new ApiException(
                    ErrorCode.FORBIDDEN,
                    HttpStatus.FORBIDDEN,
                    "Company administrators can only manage users within their tenant.");
        }
        return user;
    }

    private String requireCompanyAdminTenantId() {
        AuthenticatedUser user = requireRole(RoleName.ROLE_TENANT_ADMIN);
        if (user.tenantId() == null || user.tenantId().isBlank()) {
            throw new ApiException(
                    ErrorCode.FORBIDDEN,
                    HttpStatus.FORBIDDEN,
                    "A tenant-scoped administrator account is required for this operation.");
        }
        return user.tenantId();
    }

    private AuthenticatedUser requireRole(RoleName roleName) {
        AuthenticatedUser user = currentAuthenticatedUserService.requireCurrentUser();
        boolean hasRole = user.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals(roleName.name()));
        if (!hasRole) {
            throw new ApiException(
                    ErrorCode.FORBIDDEN,
                    HttpStatus.FORBIDDEN,
                    "The current user does not have permission to perform this action.");
        }
        return user;
    }

    private String normalizeTenantId(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            return null;
        }
        return tenantId.trim();
    }

    private void recordUserCreated(AppUser user) {
        auditLogService.record(new AuditLogCommand(
                null,
                user.getTenantId(),
                "USER",
                "CREATED",
                "USER",
                resolveEntityId(user),
                "User " + user.getEmail() + " was created.",
                null,
                snapshot(user)));
        auditLogService.record(new AuditLogCommand(
                null,
                user.getTenantId(),
                "ROLE",
                "ASSIGNMENT_CHANGED",
                "USER",
                resolveEntityId(user),
                "Initial role assignments were set for user " + user.getEmail() + ".",
                null,
                java.util.Map.of("roles", user.getRoles().stream().map(Enum::name).toList())));
    }

    private void recordUserUpdated(AppUser user, Object oldSnapshot, Set<RoleName> previousRoles) {
        auditLogService.record(new AuditLogCommand(
                null,
                user.getTenantId(),
                "USER",
                "UPDATED",
                "USER",
                resolveEntityId(user),
                "User " + user.getEmail() + " was updated.",
                oldSnapshot,
                snapshot(user)));
        if (!previousRoles.equals(user.getRoles())) {
            auditLogService.record(new AuditLogCommand(
                    null,
                    user.getTenantId(),
                    "ROLE",
                    "ASSIGNMENT_CHANGED",
                    "USER",
                    resolveEntityId(user),
                    "Role assignments changed for user " + user.getEmail() + ".",
                    java.util.Map.of("roles", previousRoles.stream().map(Enum::name).toList()),
                    java.util.Map.of("roles", user.getRoles().stream().map(Enum::name).toList())));
        }
    }

    private String resolveEntityId(AppUser user) {
        if (user.getId() != null) {
            return user.getId().toString();
        }
        return user.getEmail();
    }

    private Object snapshot(AppUser user) {
        java.util.Map<String, Object> values = new java.util.LinkedHashMap<>();
        values.put("id", user.getId());
        values.put("tenantId", user.getTenantId());
        values.put("email", user.getEmail());
        values.put("firstName", user.getFirstName());
        values.put("lastName", user.getLastName());
        values.put("status", user.getStatus() == null ? null : user.getStatus().name());
        values.put("roles", user.getRoles().stream().map(Enum::name).toList());
        return values;
    }

    private UserResponse toResponse(AppUser user) {
        var portalScope = user.getId() == null ? null : portalAccessService.findScope(user.getId()).orElse(null);
        return new UserResponse(
                user.getId(),
                user.getTenantId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getStatus().name(),
                user.getRoles().stream().map(Enum::name)
                        .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new)),
                portalScope == null ? null : portalScope.getPortalSubjectType(),
                portalScope == null ? null : portalScope.getPortalSubjectId(),
                user.getLastLoginAt(),
                user.getCreatedAt(),
                user.getUpdatedAt());
    }
}
