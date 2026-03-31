package com.transportplatform.tms.features.compliance.domain;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ComplianceIssueRepository
        extends JpaRepository<ComplianceIssue, Long>, JpaSpecificationExecutor<ComplianceIssue> {

    Optional<ComplianceIssue> findByIdAndTenantId(Long id, String tenantId);

    Optional<ComplianceIssue> findByTenantIdAndSourceKey(String tenantId, String sourceKey);

    List<ComplianceIssue> findAllByTenantId(String tenantId);

    List<ComplianceIssue> findAllByTenantIdAndIssueStatusIn(String tenantId,
            Collection<ComplianceIssueStatus> statuses);
}