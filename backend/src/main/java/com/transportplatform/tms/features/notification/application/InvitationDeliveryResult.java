package com.transportplatform.tms.features.notification.application;

import com.transportplatform.tms.features.notification.domain.NotificationDeliveryStatus;

public record InvitationDeliveryResult(NotificationDeliveryStatus deliveryStatus, String errorMessage) {
}