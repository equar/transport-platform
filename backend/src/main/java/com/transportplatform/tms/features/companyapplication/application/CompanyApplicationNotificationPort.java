package com.transportplatform.tms.features.companyapplication.application;

import com.transportplatform.tms.features.companyapplication.domain.CompanyApplication;

public interface CompanyApplicationNotificationPort {

    void applicationSubmitted(CompanyApplication application);

    void applicationApproved(CompanyApplication application);

    void applicationRejected(CompanyApplication application);
}
