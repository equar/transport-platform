package com.transportplatform.tms.features.companyapplication.application;

import com.transportplatform.tms.features.companyapplication.domain.CompanyApplication;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class LoggingCompanyApplicationNotificationAdapter implements CompanyApplicationNotificationPort {

    private static final Logger LOGGER = LoggerFactory.getLogger(LoggingCompanyApplicationNotificationAdapter.class);

    @Override
    public void applicationSubmitted(CompanyApplication application) {
        LOGGER.info("Company application {} submitted for {}", application.getApplicationNumber(),
                application.getEmail());
    }

    @Override
    public void applicationApproved(CompanyApplication application) {
        LOGGER.info("Company application {} approved for tenant {}", application.getApplicationNumber(),
                application.getApprovedTenantId());
    }

    @Override
    public void applicationRejected(CompanyApplication application) {
        LOGGER.info("Company application {} rejected", application.getApplicationNumber());
    }
}
