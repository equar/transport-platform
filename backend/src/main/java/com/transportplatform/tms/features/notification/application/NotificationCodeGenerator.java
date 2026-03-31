package com.transportplatform.tms.features.notification.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.notification.domain.NotificationRepository;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class NotificationCodeGenerator {

    private final NotificationRepository notificationRepository;

    public NotificationCodeGenerator(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public String generate(String tenantId) {
        for (int attempt = 0; attempt < 10; attempt++) {
            String code = "NTF-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
            if (!notificationRepository.existsByTenantIdAndNotificationCodeIgnoreCase(tenantId, code)) {
                return code;
            }
        }
        throw new ApiException(
                ErrorCode.INTERNAL_SERVER_ERROR,
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Notification code generation failed.");
    }
}