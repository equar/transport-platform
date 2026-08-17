package com.transportplatform.tms.features.notification.domain;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PortalPushDeviceTokenRepository extends JpaRepository<PortalPushDeviceToken, Long> {

    Optional<PortalPushDeviceToken> findByPushToken(String pushToken);

    List<PortalPushDeviceToken> findAllByTenantIdAndAppUserIdAndStatus(
            String tenantId,
            Long appUserId,
            PortalPushDeviceTokenStatus status);

    Optional<PortalPushDeviceToken> findByTenantIdAndAppUserIdAndPushToken(
            String tenantId,
            Long appUserId,
            String pushToken);
}
