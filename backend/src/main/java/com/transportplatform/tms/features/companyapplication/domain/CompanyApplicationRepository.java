package com.transportplatform.tms.features.companyapplication.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface CompanyApplicationRepository
        extends JpaRepository<CompanyApplication, Long>, JpaSpecificationExecutor<CompanyApplication> {

    long countByStatus(CompanyApplicationStatus status);
}
