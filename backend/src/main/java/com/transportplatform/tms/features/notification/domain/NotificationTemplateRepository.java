package com.transportplatform.tms.features.notification.domain;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface NotificationTemplateRepository
                extends JpaRepository<NotificationTemplate, Long>, JpaSpecificationExecutor<NotificationTemplate> {

        Optional<NotificationTemplate> findByIdAndTenantId(Long id, String tenantId);

        boolean existsByTenantIdAndTemplateCodeIgnoreCase(String tenantId, String templateCode);

        Optional<NotificationTemplate> findFirstByTenantIdAndEventTypeAndChannelAndStatusOrderByDefaultTemplateDescUpdatedAtDesc(
                        String tenantId,
                        NotificationType eventType,
                        NotificationChannel channel,
                        NotificationTemplateStatus status);

        boolean existsByTenantIdAndEventTypeAndChannel(String tenantId,
                        NotificationType eventType,
                        NotificationChannel channel);
}