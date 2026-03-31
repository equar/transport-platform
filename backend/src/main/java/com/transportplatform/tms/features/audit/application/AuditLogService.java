package com.transportplatform.tms.features.audit.application;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.features.audit.api.response.AuditLogResponse;
import com.transportplatform.tms.features.audit.api.response.DashboardActivityResponse;
import com.transportplatform.tms.features.audit.domain.AuditLog;
import com.transportplatform.tms.features.audit.domain.AuditLogRepository;
import com.transportplatform.tms.features.auth.domain.RoleName;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    public AuditLogService(AuditLogRepository auditLogRepository, ObjectMapper objectMapper) {
        this.auditLogRepository = auditLogRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void record(AuditLogCommand command) {
        AuditLogActor actor = resolveActor(command.actor());
        AuditLog auditLog = new AuditLog();
        auditLog.setActorUserId(actor.userId());
        auditLog.setActorEmail(actor.email());
        auditLog.setActorName(actor.name());
        auditLog.setTenantId(blankToNull(command.tenantId()));
        auditLog.setModule(normalize(command.module()));
        auditLog.setAction(normalize(command.action()));
        auditLog.setEntityType(normalize(command.entityType()));
        auditLog.setEntityId(command.entityId());
        auditLog.setSummary(command.summary());
        auditLog.setOldValueJson(writeJson(command.oldValue()));
        auditLog.setNewValueJson(writeJson(command.newValue()));
        auditLogRepository.save(auditLog);
    }

    @Transactional(readOnly = true)
    public PageResponse<AuditLogResponse> search(String keyword,
            String module,
            String action,
            LocalDate createdFrom,
            LocalDate createdTo,
            int page,
            int size) {
        AuditScope scope = resolveScope();
        Specification<AuditLog> specification = Specification.allOf(
                AuditLogSpecifications.keyword(keyword),
                AuditLogSpecifications.module(module),
                AuditLogSpecifications.action(action),
                AuditLogSpecifications.createdAtFrom(
                        createdFrom == null ? null : createdFrom.atStartOfDay().toInstant(ZoneOffset.UTC)),
                AuditLogSpecifications.createdAtTo(
                        createdTo == null ? null : createdTo.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC)),
                scope.tenantId() == null ? Specification.allOf()
                        : AuditLogSpecifications.tenantScope(scope.tenantId()));
        return PageResponse.from(auditLogRepository.findAll(
                specification,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))).map(this::toResponse));
    }

    @Transactional(readOnly = true)
    public List<DashboardActivityResponse> getRecentPlatformActivity(int limit) {
        requirePlatformAdmin();
        return auditLogRepository.findAll(
                PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "createdAt"))).stream()
                .map(this::toDashboardActivity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DashboardActivityResponse> getRecentCompanyActivity(int limit) {
        AuditScope scope = resolveScope();
        if (scope.tenantId() == null) {
            throw new ApiException(
                    ErrorCode.FORBIDDEN,
                    HttpStatus.FORBIDDEN,
                    "A tenant-scoped administrator account is required to access company activity.");
        }
        return auditLogRepository.findAll(
                AuditLogSpecifications.tenantScope(scope.tenantId()),
                PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "createdAt"))).stream()
                .map(this::toDashboardActivity)
                .toList();
    }

    private AuditLogActor resolveActor(AuditLogActor fallbackActor) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AuthenticatedUser authenticatedUser) {
            return new AuditLogActor(authenticatedUser.id(), authenticatedUser.username(),
                    authenticatedUser.displayName());
        }
        if (fallbackActor != null) {
            return fallbackActor;
        }
        return new AuditLogActor(null, "system", "System");
    }

    private AuditScope resolveScope() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser user)) {
            throw new ApiException(
                    ErrorCode.UNAUTHORIZED,
                    HttpStatus.UNAUTHORIZED,
                    "An authenticated user is required to access audit logs.");
        }
        boolean platformAdmin = user.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals(RoleName.ROLE_PLATFORM_ADMIN.name()));
        if (platformAdmin) {
            return new AuditScope(null);
        }
        boolean companyAdmin = user.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals(RoleName.ROLE_TENANT_ADMIN.name()));
        if (companyAdmin && user.tenantId() != null && !user.tenantId().isBlank()) {
            return new AuditScope(user.tenantId());
        }
        throw new ApiException(
                ErrorCode.FORBIDDEN,
                HttpStatus.FORBIDDEN,
                "You do not have permission to access audit logs.");
    }

    private void requirePlatformAdmin() {
        if (resolveScope().tenantId() != null) {
            throw new ApiException(
                    ErrorCode.FORBIDDEN,
                    HttpStatus.FORBIDDEN,
                    "Platform administrator access is required.");
        }
    }

    private AuditLogResponse toResponse(AuditLog auditLog) {
        return new AuditLogResponse(
                auditLog.getId(),
                auditLog.getActorUserId(),
                auditLog.getActorName(),
                auditLog.getActorEmail(),
                auditLog.getTenantId(),
                auditLog.getModule(),
                auditLog.getAction(),
                auditLog.getEntityType(),
                auditLog.getEntityId(),
                auditLog.getSummary(),
                auditLog.getOldValueJson(),
                auditLog.getNewValueJson(),
                auditLog.getCreatedAt());
    }

    private DashboardActivityResponse toDashboardActivity(AuditLog auditLog) {
        return new DashboardActivityResponse(
                auditLog.getId(),
                auditLog.getCreatedAt(),
                auditLog.getActorName(),
                auditLog.getActorEmail(),
                auditLog.getModule(),
                auditLog.getAction(),
                auditLog.getEntityType(),
                auditLog.getEntityId(),
                auditLog.getSummary(),
                auditLog.getTenantId());
    }

    private String writeJson(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new ApiException(
                    ErrorCode.INTERNAL_SERVER_ERROR,
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Audit log serialization failed.");
        }
    }

    private String normalize(String value) {
        return value == null ? null : value.trim().toUpperCase();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private record AuditScope(String tenantId) {
    }
}