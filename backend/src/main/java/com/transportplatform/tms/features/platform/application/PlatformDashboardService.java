package com.transportplatform.tms.features.platform.application;

import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.companyapplication.domain.CompanyApplicationRepository;
import com.transportplatform.tms.features.companyapplication.domain.CompanyApplicationStatus;
import com.transportplatform.tms.features.auth.domain.AppUserRepository;
import com.transportplatform.tms.features.auth.domain.UserStatus;
import com.transportplatform.tms.features.saas.domain.FeatureFlagRepository;
import com.transportplatform.tms.features.saas.domain.FeatureFlagStatus;
import com.transportplatform.tms.features.saas.domain.SubscriptionPlanRepository;
import com.transportplatform.tms.features.saas.domain.SubscriptionPlanStatus;
import com.transportplatform.tms.features.saas.domain.TenantSubscriptionRepository;
import com.transportplatform.tms.features.saas.domain.TenantSubscriptionStatus;
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
        private final TenantSubscriptionRepository tenantSubscriptionRepository;
        private final SubscriptionPlanRepository subscriptionPlanRepository;
        private final FeatureFlagRepository featureFlagRepository;

        public PlatformDashboardService(TenantRepository tenantRepository,
                        CompanyApplicationRepository companyApplicationRepository,
                        AppUserRepository appUserRepository,
                        AuditLogService auditLogService,
                        TenantSubscriptionRepository tenantSubscriptionRepository,
                        SubscriptionPlanRepository subscriptionPlanRepository,
                        FeatureFlagRepository featureFlagRepository) {
                this.tenantRepository = tenantRepository;
                this.companyApplicationRepository = companyApplicationRepository;
                this.appUserRepository = appUserRepository;
                this.auditLogService = auditLogService;
                this.tenantSubscriptionRepository = tenantSubscriptionRepository;
                this.subscriptionPlanRepository = subscriptionPlanRepository;
                this.featureFlagRepository = featureFlagRepository;
        }

        @Transactional(readOnly = true)
        public PlatformDashboardSummaryResponse getSummary() {
                long pendingApplications = companyApplicationRepository
                                .countByStatus(CompanyApplicationStatus.SUBMITTED)
                                + companyApplicationRepository.countByStatus(CompanyApplicationStatus.UNDER_REVIEW);
                long approvedApplications = companyApplicationRepository
                                .countByStatus(CompanyApplicationStatus.APPROVED)
                                + companyApplicationRepository.countByStatus(CompanyApplicationStatus.ONBOARDING)
                                + companyApplicationRepository.countByStatus(CompanyApplicationStatus.ACTIVE);

                return new PlatformDashboardSummaryResponse(
                                tenantRepository.count(),
                                tenantRepository.countByStatus(TenantStatus.ACTIVE),
                                tenantRepository.countByStatus(TenantStatus.SUSPENDED),
                                tenantSubscriptionRepository.countByStatus(TenantSubscriptionStatus.ACTIVE),
                                tenantSubscriptionRepository.countByStatus(TenantSubscriptionStatus.TRIAL),
                                tenantSubscriptionRepository.countByStatus(TenantSubscriptionStatus.SUSPENDED),
                                subscriptionPlanRepository.countByStatus(SubscriptionPlanStatus.ACTIVE),
                                featureFlagRepository.countByStatus(FeatureFlagStatus.ACTIVE),
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
