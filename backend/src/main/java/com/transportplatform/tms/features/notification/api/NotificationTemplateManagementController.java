package com.transportplatform.tms.features.notification.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.notification.api.request.NotificationTemplateUpsertRequest;
import com.transportplatform.tms.features.notification.api.response.NotificationTemplateDetailResponse;
import com.transportplatform.tms.features.notification.api.response.NotificationTemplateSummaryResponse;
import com.transportplatform.tms.features.notification.application.NotificationTemplateService;
import com.transportplatform.tms.features.notification.domain.NotificationChannel;
import com.transportplatform.tms.features.notification.domain.NotificationTemplateStatus;
import com.transportplatform.tms.features.notification.domain.NotificationType;
import jakarta.validation.Valid;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class NotificationTemplateManagementController {

    private final NotificationTemplateService notificationTemplateService;

    public NotificationTemplateManagementController(NotificationTemplateService notificationTemplateService) {
        this.notificationTemplateService = notificationTemplateService;
    }

    @GetMapping("/company/notification-templates")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<PageResponse<NotificationTemplateSummaryResponse>> searchCompanyTemplates(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) NotificationTemplateStatus status,
            @RequestParam(required = false) NotificationType eventType,
            @RequestParam(required = false) NotificationChannel channel,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "updatedAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction sortDirection) {
        return ApiResponse.success(notificationTemplateService.searchCompanyTemplates(
                keyword,
                status,
                eventType,
                channel,
                page,
                size,
                sortBy,
                sortDirection));
    }

    @GetMapping("/company/notification-templates/{templateId}")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<NotificationTemplateDetailResponse> getCompanyTemplate(@PathVariable Long templateId) {
        return ApiResponse.success(notificationTemplateService.getCompanyTemplate(templateId));
    }

    @PostMapping("/company/notification-templates")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<NotificationTemplateDetailResponse> createCompanyTemplate(
            @Valid @RequestBody NotificationTemplateUpsertRequest request) {
        return ApiResponse.success(notificationTemplateService.createCompanyTemplate(request));
    }

    @PutMapping("/company/notification-templates/{templateId}")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<NotificationTemplateDetailResponse> updateCompanyTemplate(@PathVariable Long templateId,
            @Valid @RequestBody NotificationTemplateUpsertRequest request) {
        return ApiResponse.success(notificationTemplateService.updateCompanyTemplate(templateId, request));
    }

    @PostMapping("/company/notification-templates/{templateId}/activate")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<NotificationTemplateDetailResponse> activateCompanyTemplate(@PathVariable Long templateId) {
        return ApiResponse.success(notificationTemplateService.activateCompanyTemplate(templateId));
    }

    @PostMapping("/company/notification-templates/{templateId}/deactivate")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<NotificationTemplateDetailResponse> deactivateCompanyTemplate(@PathVariable Long templateId) {
        return ApiResponse.success(notificationTemplateService.deactivateCompanyTemplate(templateId));
    }
}