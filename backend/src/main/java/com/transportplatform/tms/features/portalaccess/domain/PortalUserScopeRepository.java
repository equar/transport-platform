package com.transportplatform.tms.features.portalaccess.domain;

import java.util.Optional;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PortalUserScopeRepository extends JpaRepository<PortalUserScope, Long> {

    Optional<PortalUserScope> findByAppUserId(Long appUserId);

    List<PortalUserScope> findAllByTenantIdAndPortalSubjectType(
            String tenantId,
            PortalSubjectType portalSubjectType);

    Optional<PortalUserScope> findByTenantIdAndPortalSubjectTypeAndPortalSubjectId(
            String tenantId,
            PortalSubjectType portalSubjectType,
            Long portalSubjectId);
}
