package com.transportplatform.tms.features.companydashboard.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.auth.domain.AppUserRepository;
import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.auth.domain.UserStatus;
import com.transportplatform.tms.features.driver.application.DriverComplianceSummaryService;
import com.transportplatform.tms.features.driver.domain.DriverRepository;
import com.transportplatform.tms.features.driver.domain.DriverStatus;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CompanyDashboardService {

    private final AppUserRepository appUserRepository;
    private final CurrentAuthenticatedUserService currentAuthenticatedUserService;
    private final AuditLogService auditLogService;
    private final DriverRepository driverRepository;
    private final DriverComplianceSummaryService driverComplianceSummaryService;

    public CompanyDashboardService(AppUserRepository appUserRepository,
            CurrentAuthenticatedUserService currentAuthenticatedUserService,
            AuditLogService auditLogService,
            DriverRepository driverRepository,
            DriverComplianceSummaryService driverComplianceSummaryService) {
        this.appUserRepository = appUserRepository;
        this.currentAuthenticatedUserService = currentAuthenticatedUserService;
        this.auditLogService = auditLogService;
        this.driverRepository = driverRepository;
        this.driverComplianceSummaryService = driverComplianceSummaryService;
    }

    @Transactional(readOnly = true)
    public CompanyDashboardSummaryResponse getSummary() {
        AuthenticatedUser currentUser = currentAuthenticatedUserService.requireCurrentUser();
        boolean hasCompanyAdminRole = currentUser.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals(RoleName.ROLE_TENANT_ADMIN.name()));
        if (!hasCompanyAdminRole || currentUser.tenantId() == null || currentUser.tenantId().isBlank()) {
            throw new ApiException(
                    ErrorCode.FORBIDDEN,
                    HttpStatus.FORBIDDEN,
                    "A company administrator account is required to access the company dashboard.");
        }

        String tenantId = currentUser.tenantId();
        List<com.transportplatform.tms.features.driver.domain.Driver> drivers = driverRepository
                .findAllByTenantId(tenantId);
        return new CompanyDashboardSummaryResponse(
                appUserRepository.countByTenantId(tenantId),
                appUserRepository.countByTenantIdAndStatus(tenantId, UserStatus.ACTIVE),
                appUserRepository.countByTenantIdAndStatus(tenantId, UserStatus.SUSPENDED),
                appUserRepository.countByTenantIdAndStatus(tenantId, UserStatus.INVITED),
                drivers.size(),
                driverRepository.countByTenantIdAndStatus(tenantId, DriverStatus.ACTIVE),
                driverRepository.countByTenantIdAndStatus(tenantId, DriverStatus.SUSPENDED),
                driverRepository.countByTenantIdAndStatus(tenantId, DriverStatus.APPLIED)
                        + driverRepository.countByTenantIdAndStatus(tenantId, DriverStatus.PENDING_REVIEW),
                driverComplianceSummaryService.countDriversWithExpiredDocuments(tenantId, drivers),
                driverComplianceSummaryService.countDriversWithMissingRequiredDocuments(tenantId, drivers),
                auditLogService.getRecentCompanyActivity(8));
    }
}