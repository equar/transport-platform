package com.transportplatform.tms.features.notification.domain;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface NotificationRepository
        extends JpaRepository<Notification, Long>, JpaSpecificationExecutor<Notification> {

    Optional<Notification> findByIdAndTenantIdAndRecipientUserId(Long id, String tenantId, Long recipientUserId);

    boolean existsByTenantIdAndNotificationCodeIgnoreCase(String tenantId, String notificationCode);

    long countByTenantIdAndRecipientUserIdAndReadStatusAndStatus(String tenantId,
            Long recipientUserId,
            NotificationReadStatus readStatus,
            NotificationStatus status);

    List<Notification> findTop10ByTenantIdAndRecipientUserIdAndStatusOrderByCreatedAtDesc(String tenantId,
            Long recipientUserId,
            NotificationStatus status);

    List<Notification> findAllByTenantIdAndRecipientUserIdAndReadStatusAndStatus(String tenantId,
            Long recipientUserId,
            NotificationReadStatus readStatus,
            NotificationStatus status);
}