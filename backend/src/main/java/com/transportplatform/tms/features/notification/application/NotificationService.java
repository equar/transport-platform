package com.transportplatform.tms.features.notification.application;

import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.features.audit.application.AuditLogCommand;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.notification.api.response.NotificationDetailResponse;
import com.transportplatform.tms.features.notification.api.response.NotificationMarkAllReadResponse;
import com.transportplatform.tms.features.notification.api.response.NotificationSummaryResponse;
import com.transportplatform.tms.features.notification.api.response.NotificationUnreadCountResponse;
import com.transportplatform.tms.features.notification.domain.Notification;
import com.transportplatform.tms.features.notification.domain.NotificationChannel;
import com.transportplatform.tms.features.notification.domain.NotificationReadStatus;
import com.transportplatform.tms.features.notification.domain.NotificationRepository;
import com.transportplatform.tms.features.notification.domain.NotificationStatus;
import com.transportplatform.tms.features.notification.domain.NotificationType;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationAccessService notificationAccessService;
    private final NotificationMapper notificationMapper;
    private final AuditLogService auditLogService;
    private final Clock clock;

    public NotificationService(NotificationRepository notificationRepository,
            NotificationAccessService notificationAccessService,
            NotificationMapper notificationMapper,
            AuditLogService auditLogService,
            Clock clock) {
        this.notificationRepository = notificationRepository;
        this.notificationAccessService = notificationAccessService;
        this.notificationMapper = notificationMapper;
        this.auditLogService = auditLogService;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public PageResponse<NotificationSummaryResponse> searchCurrentUserNotifications(String keyword,
            NotificationReadStatus readStatus,
            NotificationType notificationType,
            NotificationChannel channel,
            LocalDate fromDate,
            LocalDate toDate,
            int page,
            int size,
            String sortBy,
            Sort.Direction sortDirection) {
        AuthenticatedUser user = notificationAccessService.requireCurrentTenantUser();
        return PageResponse.from(notificationRepository.findAll(
                NotificationSpecifications.search(
                        user.tenantId(),
                        user.id(),
                        keyword,
                        readStatus,
                        notificationType,
                        channel,
                        fromDate == null ? null : fromDate.atStartOfDay().toInstant(ZoneOffset.UTC),
                        toDate == null ? null : toDate.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC)),
                PageRequest.of(page, size, Sort.by(sortDirection, resolveSortField(sortBy))))
                .map(notificationMapper::toSummary));
    }

    @Transactional(readOnly = true)
    public NotificationDetailResponse getCurrentUserNotification(Long notificationId) {
        return notificationMapper.toDetail(notificationAccessService.findCurrentUserNotification(notificationId));
    }

    @Transactional(readOnly = true)
    public List<NotificationSummaryResponse> getLatestCurrentUserNotifications(int limit) {
        AuthenticatedUser user = notificationAccessService.requireCurrentTenantUser();
        return notificationRepository.findAll(
                NotificationSpecifications.search(user.tenantId(), user.id(), "", null, null, null, null, null),
                PageRequest.of(0, Math.max(1, Math.min(limit, 20)), Sort.by(Sort.Direction.DESC, "createdAt"))).stream()
                .map(notificationMapper::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public NotificationUnreadCountResponse getCurrentUserUnreadCount() {
        AuthenticatedUser user = notificationAccessService.requireCurrentTenantUser();
        return new NotificationUnreadCountResponse(countUnreadNotifications(user.tenantId(), user.id()));
    }

    @Transactional
    public NotificationDetailResponse markCurrentUserNotificationRead(Long notificationId) {
        Notification notification = notificationAccessService.findCurrentUserNotification(notificationId);
        if (notification.getReadStatus() != NotificationReadStatus.READ) {
            NotificationReadStatus previousStatus = notification.getReadStatus();
            notification.setReadStatus(NotificationReadStatus.READ);
            notification.setReadAt(java.time.Instant.now(clock));
            notification = notificationRepository.save(notification);
            recordNotificationAudit(notification, "MARKED_READ",
                    "Notification " + notification.getNotificationCode() + " was marked read.",
                    previousStatus.name(),
                    NotificationReadStatus.READ.name());
        }
        return notificationMapper.toDetail(notification);
    }

    @Transactional
    public NotificationDetailResponse markCurrentUserNotificationUnread(Long notificationId) {
        Notification notification = notificationAccessService.findCurrentUserNotification(notificationId);
        if (notification.getReadStatus() != NotificationReadStatus.UNREAD) {
            NotificationReadStatus previousStatus = notification.getReadStatus();
            notification.setReadStatus(NotificationReadStatus.UNREAD);
            notification.setReadAt(null);
            notification = notificationRepository.save(notification);
            recordNotificationAudit(notification, "MARKED_UNREAD",
                    "Notification " + notification.getNotificationCode() + " was marked unread.",
                    previousStatus.name(),
                    NotificationReadStatus.UNREAD.name());
        }
        return notificationMapper.toDetail(notification);
    }

    @Transactional
    public NotificationMarkAllReadResponse markAllCurrentUserNotificationsRead() {
        AuthenticatedUser user = notificationAccessService.requireCurrentTenantUser();
        List<Notification> unreadNotifications = notificationRepository
                .findAllByTenantIdAndRecipientUserIdAndReadStatusAndStatus(
                        user.tenantId(),
                        user.id(),
                        NotificationReadStatus.UNREAD,
                        NotificationStatus.ACTIVE);
        if (unreadNotifications.isEmpty()) {
            return new NotificationMarkAllReadResponse(0);
        }
        java.time.Instant readAt = java.time.Instant.now(clock);
        unreadNotifications.forEach(notification -> {
            notification.setReadStatus(NotificationReadStatus.READ);
            notification.setReadAt(readAt);
        });
        notificationRepository.saveAll(unreadNotifications);
        auditLogService.record(new AuditLogCommand(
                null,
                user.tenantId(),
                "NOTIFICATION",
                "MARKED_ALL_READ",
                "NOTIFICATION",
                user.id().toString(),
                unreadNotifications.size() + " notifications were marked read.",
                null,
                java.util.Map.of("updatedCount", unreadNotifications.size())));
        return new NotificationMarkAllReadResponse(unreadNotifications.size());
    }

    public long countUnreadNotifications(String tenantId, Long recipientUserId) {
        return notificationRepository.countByTenantIdAndRecipientUserIdAndReadStatusAndStatus(
                tenantId,
                recipientUserId,
                NotificationReadStatus.UNREAD,
                NotificationStatus.ACTIVE);
    }

    private void recordNotificationAudit(Notification notification,
            String action,
            String summary,
            Object oldValue,
            Object newValue) {
        auditLogService.record(new AuditLogCommand(
                null,
                notification.getTenantId(),
                "NOTIFICATION",
                action,
                "NOTIFICATION",
                notification.getId().toString(),
                summary,
                oldValue,
                newValue));
    }

    private String resolveSortField(String sortBy) {
        String resolved = sortBy == null ? "createdAt" : sortBy;
        return switch (resolved) {
            case "createdAt", "sentAt", "readAt", "notificationCode", "title" -> resolved;
            default -> "createdAt";
        };
    }
}