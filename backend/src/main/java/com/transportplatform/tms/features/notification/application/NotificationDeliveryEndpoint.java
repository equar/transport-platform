package com.transportplatform.tms.features.notification.application;

import com.transportplatform.tms.features.notification.domain.NotificationChannel;
import com.transportplatform.tms.features.notification.domain.NotificationDeliveryStatus;
import com.transportplatform.tms.features.notification.domain.NotificationRepository;
import com.transportplatform.tms.features.notification.domain.NotificationStatus;
import org.springframework.boot.actuate.endpoint.annotation.Endpoint;
import org.springframework.boot.actuate.endpoint.annotation.ReadOperation;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Component;

@Component
@Endpoint(id = "notificationDelivery")
public class NotificationDeliveryEndpoint {

    private final NotificationRepository notificationRepository;

    public NotificationDeliveryEndpoint(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @ReadOperation
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    public NotificationDeliveryResponse notificationDelivery() {
        long terminalEmailFailureCount = notificationRepository
                .countByChannelAndDeliveryStatusAndNextDeliveryAttemptAtIsNullAndStatus(
                        NotificationChannel.EMAIL,
                        NotificationDeliveryStatus.FAILED,
                        NotificationStatus.ACTIVE);
        return new NotificationDeliveryResponse(terminalEmailFailureCount);
    }

    public record NotificationDeliveryResponse(long terminalEmailFailureCount) {
    }
}