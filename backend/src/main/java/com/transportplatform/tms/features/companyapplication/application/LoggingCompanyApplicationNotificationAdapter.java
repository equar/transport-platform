package com.transportplatform.tms.features.companyapplication.application;

import com.transportplatform.tms.features.companyapplication.domain.CompanyApplication;
import com.transportplatform.tms.features.notification.application.NotificationEventService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class LoggingCompanyApplicationNotificationAdapter implements CompanyApplicationNotificationPort {

    private static final Logger LOGGER = LoggerFactory.getLogger(LoggingCompanyApplicationNotificationAdapter.class);

    private final NotificationEventService notificationEventService;

    public LoggingCompanyApplicationNotificationAdapter(NotificationEventService notificationEventService) {
        this.notificationEventService = notificationEventService;
    }

    @Override
    public void applicationSubmitted(CompanyApplication application) {
        LOGGER.info("Company application {} submitted for {}", application.getApplicationNumber(),
                application.getEmail());
        notificationEventService.publishCompanyApplicationSubmitted(application);
    }

    @Override
    public void applicationApproved(CompanyApplication application) {
        LOGGER.info("Company application {} approved for tenant {}", application.getApplicationNumber(),
                application.getApprovedTenantId());
        notificationEventService.publishCompanyApplicationApproved(application);
    }

    @Override
    public void applicationRejected(CompanyApplication application) {
        LOGGER.info("Company application {} rejected", application.getApplicationNumber());
        notificationEventService.publishCompanyApplicationRejected(application);
    }
}
