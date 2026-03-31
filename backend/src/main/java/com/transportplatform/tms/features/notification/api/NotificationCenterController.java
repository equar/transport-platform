package com.transportplatform.tms.features.notification.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.notification.api.response.NotificationDetailResponse;
import com.transportplatform.tms.features.notification.api.response.NotificationMarkAllReadResponse;
import com.transportplatform.tms.features.notification.api.response.NotificationSummaryResponse;
import com.transportplatform.tms.features.notification.api.response.NotificationUnreadCountResponse;
import com.transportplatform.tms.features.notification.application.NotificationService;
import com.transportplatform.tms.features.notification.domain.NotificationChannel;
import com.transportplatform.tms.features.notification.domain.NotificationReadStatus;
import com.transportplatform.tms.features.notification.domain.NotificationType;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class NotificationCenterController {

    private final NotificationService notificationService;

    public NotificationCenterController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/notifications")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<PageResponse<NotificationSummaryResponse>> searchCurrentUserNotifications(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) NotificationReadStatus readStatus,
            @RequestParam(required = false) NotificationType notificationType,
            @RequestParam(required = false) NotificationChannel channel,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction sortDirection) {
        return ApiResponse.success(notificationService.searchCurrentUserNotifications(
                keyword,
                readStatus,
                notificationType,
                channel,
                fromDate,
                toDate,
                page,
                size,
                sortBy,
                sortDirection));
    }

    @GetMapping("/notifications/latest")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<NotificationSummaryResponse>> getLatestCurrentUserNotifications(
            @RequestParam(defaultValue = "5") int limit) {
        return ApiResponse.success(notificationService.getLatestCurrentUserNotifications(limit));
    }

    @GetMapping("/notifications/unread-count")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<NotificationUnreadCountResponse> getCurrentUserUnreadCount() {
        return ApiResponse.success(notificationService.getCurrentUserUnreadCount());
    }

    @GetMapping("/notifications/{notificationId}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<NotificationDetailResponse> getCurrentUserNotification(@PathVariable Long notificationId) {
        return ApiResponse.success(notificationService.getCurrentUserNotification(notificationId));
    }

    @PostMapping("/notifications/{notificationId}/read")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<NotificationDetailResponse> markCurrentUserNotificationRead(@PathVariable Long notificationId) {
        return ApiResponse.success(notificationService.markCurrentUserNotificationRead(notificationId));
    }

    @PostMapping("/notifications/{notificationId}/unread")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<NotificationDetailResponse> markCurrentUserNotificationUnread(
            @PathVariable Long notificationId) {
        return ApiResponse.success(notificationService.markCurrentUserNotificationUnread(notificationId));
    }

    @PostMapping("/notifications/read-all")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<NotificationMarkAllReadResponse> markAllCurrentUserNotificationsRead() {
        return ApiResponse.success(notificationService.markAllCurrentUserNotificationsRead());
    }
}