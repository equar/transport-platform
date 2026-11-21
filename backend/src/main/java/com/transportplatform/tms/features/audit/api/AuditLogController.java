package com.transportplatform.tms.features.audit.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.audit.api.response.AuditLogResponse;
import com.transportplatform.tms.features.audit.application.AuditLogService;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/audit-logs")
@PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'TENANT_ADMIN')")
public class AuditLogController {
    @org.springframework.beans.factory.annotation.Autowired
    private com.transportplatform.tms.features.audit.application.AuditIntegrityService integrity;

    @org.springframework.beans.factory.annotation.Autowired
    private com.transportplatform.tms.common.security.CurrentAuthenticatedUserService users;

    @GetMapping("/integrity")
    public ApiResponse<
                    com.transportplatform.tms.features.audit.application.AuditIntegrityService
                            .Verification>
            verify(
                    @RequestParam(required = false) String tenantId,
                    @RequestParam(defaultValue = "0") long after,
                    @RequestParam(required = false) Long expectedSequence,
                    @RequestParam(required = false) String expectedSignature) {
        var user = users.requireCurrentUser();
        boolean platform =
                user.getAuthorities().stream()
                        .anyMatch(a -> a.getAuthority().equals("ROLE_PLATFORM_ADMIN"));
        if (!platform && tenantId != null && !tenantId.equals(user.tenantId()))
            throw new com.transportplatform.tms.common.exception.ApiException(
                    com.transportplatform.tms.common.exception.ErrorCode.FORBIDDEN,
                    org.springframework.http.HttpStatus.FORBIDDEN,
                    "Audit integrity is restricted to your company.");
        if (after < 0)
            throw new com.transportplatform.tms.common.exception.ApiException(
                    com.transportplatform.tms.common.exception.ErrorCode.VALIDATION_FAILED,
                    org.springframework.http.HttpStatus.BAD_REQUEST,
                    "Sequence must be nonnegative.");
        return ApiResponse.success(
                integrity.verify(
                        platform ? tenantId : user.tenantId(),
                        after,
                        expectedSequence,
                        expectedSignature));
    }

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public ApiResponse<PageResponse<AuditLogResponse>> search(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String entityId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate createdFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate createdTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.success(
                auditLogService.search(
                        keyword,
                        module,
                        action,
                        createdFrom,
                        createdTo,
                        page,
                        size,
                        entityType,
                        entityId));
    }
}
