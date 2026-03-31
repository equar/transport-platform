package com.transportplatform.tms.features.notification.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.notification.domain.NotificationTemplateRepository;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class NotificationTemplateCodeGenerator {

    private final NotificationTemplateRepository notificationTemplateRepository;

    public NotificationTemplateCodeGenerator(NotificationTemplateRepository notificationTemplateRepository) {
        this.notificationTemplateRepository = notificationTemplateRepository;
    }

    public String generate(String tenantId) {
        for (int attempt = 0; attempt < 10; attempt++) {
            String code = "NTM-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
            if (!notificationTemplateRepository.existsByTenantIdAndTemplateCodeIgnoreCase(tenantId, code)) {
                return code;
            }
        }
        throw new ApiException(
                ErrorCode.INTERNAL_SERVER_ERROR,
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Notification template code generation failed.");
    }
}