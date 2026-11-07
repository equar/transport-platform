package com.transportplatform.tms.features.companyapplication.domain;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface CompanyApplicationRepository
        extends JpaRepository<CompanyApplication, Long>, JpaSpecificationExecutor<CompanyApplication> {

    long countByStatus(CompanyApplicationStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<CompanyApplication> findWithWriteLockById(Long id);
}
