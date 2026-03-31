package com.transportplatform.tms.features.platform.application;

import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.companyapplication.domain.CompanyApplicationRepository;
import com.transportplatform.tms.features.companyapplication.domain.CompanyApplicationStatus;
import com.transportplatform.tms.features.auth.domain.AppUserRepository;
import com.transportplatform.tms.features.auth.domain.UserStatus;
import com.transportplatform.tms.features.tenant.domain.TenantRepository;
import com.transportplatform.tms.features.tenant.domain.TenantStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PlatformDashboardService {

    private final TenantRepository tenantRepository;
    private final CompanyApplicationRepository companyApplicationRepository;
    private final AppUserRepository appUserRepository;
    private final AuditLogService auditLogService;

    public PlatformDashboardService(TenantRepository tenantRepository,
            CompanyApplicationRepository companyApplicationRepository,
            AppUserRepository appUserRepository,
            AuditLogService auditLogService) {
        this.tenantRepository = tenantRepository;
        this.companyApplicationRepository = companyApplicationRepository;
        this.appUserRepository = appUserRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public PlatformDashboardSummaryResponse getSummary() {
        long pendingApplications = companyApplicationRepository.countByStatus(CompanyApplicationStatus.SUBMITTED)
                + companyApplicationRepository.countByStatus(CompanyApplicationStatus.UNDER_REVIEW);
        long approvedApplications = companyApplicationRepository.countByStatus(CompanyApplicationStatus.APPROVED)
                + companyApplicationRepository.countByStatus(CompanyApplicationStatus.ONBOARDING)
                + companyApplicationRepository.countByStatus(CompanyApplicationStatus.ACTIVE);

        return new PlatformDashboardSummaryResponse(
                tenantRepository.count(),
                tenantRepository.countByStatus(TenantStatus.ACTIVE),
                tenantRepository.countByStatus(TenantStatus.SUSPENDED),
                pendingApplications,
                approvedApplications,
                companyApplicationRepository.countByStatus(CompanyApplicationStatus.REJECTED),
                appUserRepository.count(),
                appUserRepository.countByStatus(UserStatus.ACTIVE),
                appUserRepository.countByStatus(UserStatus.SUSPENDED),
                appUserRepository.countByStatus(UserStatus.INVITED),
                auditLogService.getRecentPlatformActivity(8));
    }
}
