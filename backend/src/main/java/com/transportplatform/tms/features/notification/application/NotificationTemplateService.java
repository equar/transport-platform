package com.transportplatform.tms.features.notification.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.audit.application.AuditLogCommand;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.notification.api.request.NotificationTemplateUpsertRequest;
import com.transportplatform.tms.features.notification.api.response.NotificationTemplateDetailResponse;
import com.transportplatform.tms.features.notification.api.response.NotificationTemplateSummaryResponse;
import com.transportplatform.tms.features.notification.domain.NotificationChannel;
import com.transportplatform.tms.features.notification.domain.NotificationTemplate;
import com.transportplatform.tms.features.notification.domain.NotificationTemplateRepository;
import com.transportplatform.tms.features.notification.domain.NotificationTemplateStatus;
import com.transportplatform.tms.features.notification.domain.NotificationType;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationTemplateService {

    private final NotificationTemplateRepository notificationTemplateRepository;
    private final NotificationAccessService notificationAccessService;
    private final NotificationMapper notificationMapper;
    private final NotificationTemplateCodeGenerator notificationTemplateCodeGenerator;
    private final AuditLogService auditLogService;

    public NotificationTemplateService(NotificationTemplateRepository notificationTemplateRepository,
            NotificationAccessService notificationAccessService,
            NotificationMapper notificationMapper,
            NotificationTemplateCodeGenerator notificationTemplateCodeGenerator,
            AuditLogService auditLogService) {
        this.notificationTemplateRepository = notificationTemplateRepository;
        this.notificationAccessService = notificationAccessService;
        this.notificationMapper = notificationMapper;
        this.notificationTemplateCodeGenerator = notificationTemplateCodeGenerator;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public PageResponse<NotificationTemplateSummaryResponse> searchCompanyTemplates(String keyword,
            NotificationTemplateStatus status,
            NotificationType eventType,
            NotificationChannel channel,
            int page,
            int size,
            String sortBy,
            Sort.Direction sortDirection) {
        String tenantId = notificationAccessService.requireCompanyAdminTenantId();
        return PageResponse.from(notificationTemplateRepository.findAll(
                NotificationTemplateSpecifications.search(tenantId, keyword, status, eventType, channel),
                PageRequest.of(page, size, Sort.by(sortDirection, resolveSortField(sortBy))))
                .map(notificationMapper::toTemplateSummary));
    }

    @Transactional(readOnly = true)
    public NotificationTemplateDetailResponse getCompanyTemplate(Long templateId) {
        return notificationMapper.toTemplateDetail(notificationAccessService.findTemplateForCompanyScope(templateId));
    }

    @Transactional
    public NotificationTemplateDetailResponse createCompanyTemplate(NotificationTemplateUpsertRequest request) {
        String tenantId = notificationAccessService.requireCompanyAdminTenantId();
        NotificationTemplate template = new NotificationTemplate();
        template.setTenantId(tenantId);
        template.setTemplateCode(notificationTemplateCodeGenerator.generate(tenantId));
        template.setStatus(NotificationTemplateStatus.DRAFT);
        notificationMapper.apply(template, request);
        validateTemplate(template);
        NotificationTemplate saved = notificationTemplateRepository.save(template);
        recordAudit(saved, "CREATED", "Notification template " + saved.getTemplateCode() + " was created.", null,
                snapshot(saved));
        return notificationMapper.toTemplateDetail(saved);
    }

    @Transactional
    public NotificationTemplateDetailResponse updateCompanyTemplate(Long templateId,
            NotificationTemplateUpsertRequest request) {
        NotificationTemplate template = notificationAccessService.findTemplateForCompanyScope(templateId);
        Object oldSnapshot = snapshot(template);
        notificationMapper.apply(template, request);
        validateTemplate(template);
        NotificationTemplate saved = notificationTemplateRepository.save(template);
        recordAudit(saved, "UPDATED", "Notification template " + saved.getTemplateCode() + " was updated.",
                oldSnapshot, snapshot(saved));
        return notificationMapper.toTemplateDetail(saved);
    }

    @Transactional
    public NotificationTemplateDetailResponse activateCompanyTemplate(Long templateId) {
        NotificationTemplate template = notificationAccessService.findTemplateForCompanyScope(templateId);
        NotificationTemplateStatusWorkflow.ensureCanActivate(template);
        return updateStatus(template, NotificationTemplateStatus.ACTIVE, "ACTIVATED",
                "Notification template " + template.getTemplateCode() + " was activated.");
    }

    @Transactional
    public NotificationTemplateDetailResponse deactivateCompanyTemplate(Long templateId) {
        NotificationTemplate template = notificationAccessService.findTemplateForCompanyScope(templateId);
        NotificationTemplateStatusWorkflow.ensureCanDeactivate(template);
        return updateStatus(template, NotificationTemplateStatus.INACTIVE, "DEACTIVATED",
                "Notification template " + template.getTemplateCode() + " was deactivated.");
    }

    private NotificationTemplateDetailResponse updateStatus(NotificationTemplate template,
            NotificationTemplateStatus status,
            String action,
            String summary) {
        Object oldSnapshot = snapshot(template);
        template.setStatus(status);
        NotificationTemplate saved = notificationTemplateRepository.save(template);
        recordAudit(saved, action, summary, oldSnapshot, snapshot(saved));
        return notificationMapper.toTemplateDetail(saved);
    }

    private void validateTemplate(NotificationTemplate template) {
        if (template.getChannel() == NotificationChannel.EMAIL && (template.getSubjectTemplate() == null
                || template.getSubjectTemplate().isBlank())) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "Email templates require a subject template.");
        }
        if (template.getChannel() != NotificationChannel.EMAIL && (template.getTitleTemplate() == null
                || template.getTitleTemplate().isBlank())) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "In-app and future messaging templates require a title template.");
        }
    }

    private void recordAudit(NotificationTemplate template,
            String action,
            String summary,
            Object oldValue,
            Object newValue) {
        auditLogService.record(new AuditLogCommand(
                null,
                template.getTenantId(),
                "NOTIFICATION_TEMPLATE",
                action,
                "NOTIFICATION_TEMPLATE",
                template.getId().toString(),
                summary,
                oldValue,
                newValue));
    }

    private Object snapshot(NotificationTemplate template) {
        java.util.Map<String, Object> values = new java.util.LinkedHashMap<>();
        values.put("id", template.getId());
        values.put("templateCode", template.getTemplateCode());
        values.put("name", template.getName());
        values.put("eventType", template.getEventType() == null ? null : template.getEventType().name());
        values.put("channel", template.getChannel() == null ? null : template.getChannel().name());
        values.put("isDefault", template.isDefaultTemplate());
        values.put("status", template.getStatus() == null ? null : template.getStatus().name());
        return values;
    }

    private String resolveSortField(String sortBy) {
        String resolved = sortBy == null ? "updatedAt" : sortBy;
        return switch (resolved) {
            case "createdAt", "updatedAt", "templateCode", "name", "status" -> resolved;
            default -> "updatedAt";
        };
    }
}