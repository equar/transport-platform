package com.transportplatform.tms.features.companyapplication.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.audit.application.AuditLogActor;
import com.transportplatform.tms.features.audit.application.AuditLogCommand;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.companyapplication.api.request.CompanyApplicationReviewRequest;
import com.transportplatform.tms.features.companyapplication.api.request.CompanyApplicationSubmissionRequest;
import com.transportplatform.tms.features.companyapplication.api.response.CompanyApplicationResponse;
import com.transportplatform.tms.features.companyapplication.domain.CompanyApplication;
import com.transportplatform.tms.features.companyapplication.domain.CompanyApplicationRepository;
import com.transportplatform.tms.features.companyapplication.domain.CompanyApplicationReviewAction;
import com.transportplatform.tms.features.companyapplication.domain.CompanyApplicationReviewEvent;
import com.transportplatform.tms.features.companyapplication.domain.CompanyApplicationReviewEventRepository;
import com.transportplatform.tms.features.companyapplication.domain.CompanyApplicationStatus;
import java.time.YearMonth;
import org.hibernate.exception.LockAcquisitionException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.dao.CannotAcquireLockException;
import org.springframework.dao.DeadlockLoserDataAccessException;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CompanyApplicationService {

    private final CompanyApplicationRepository companyApplicationRepository;
    private final CompanyApplicationReviewEventRepository reviewEventRepository;
    private final CompanyApplicationMapper companyApplicationMapper;
    private final CompanyApplicationNotificationPort notificationPort;
    private final CompanyApplicationApprovalService approvalService;
    private final AuditLogService auditLogService;

    public CompanyApplicationService(CompanyApplicationRepository companyApplicationRepository,
            CompanyApplicationReviewEventRepository reviewEventRepository,
            CompanyApplicationMapper companyApplicationMapper,
            CompanyApplicationNotificationPort notificationPort,
            CompanyApplicationApprovalService approvalService,
            AuditLogService auditLogService) {
        this.companyApplicationRepository = companyApplicationRepository;
        this.reviewEventRepository = reviewEventRepository;
        this.companyApplicationMapper = companyApplicationMapper;
        this.notificationPort = notificationPort;
        this.approvalService = approvalService;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public CompanyApplicationResponse submit(CompanyApplicationSubmissionRequest request) {
        CompanyApplication application = new CompanyApplication();
        companyApplicationMapper.apply(application, request);
        application.setStatus(CompanyApplicationStatus.SUBMITTED);
        application.setApplicationNumber("PENDING");
        CompanyApplication saved = companyApplicationRepository.saveAndFlush(application);
        saved.setApplicationNumber(generateApplicationNumber(saved.getId()));
        saved = companyApplicationRepository.save(saved);
        reviewEventRepository.save(
                buildEvent(saved, CompanyApplicationReviewAction.SUBMITTED, null, CompanyApplicationStatus.SUBMITTED,
                        "Application submitted through the public intake form."));
        auditLogService.record(new AuditLogCommand(
                new AuditLogActor(null, "public",
                        request.contactFirstName().trim() + " " + request.contactLastName().trim()),
                null,
                "COMPANY_APPLICATION",
                "SUBMITTED",
                "COMPANY_APPLICATION",
                saved.getId().toString(),
                "Company application " + saved.getApplicationNumber() + " was submitted.",
                null,
                snapshot(saved)));
        notificationPort.applicationSubmitted(saved);
        return companyApplicationMapper.toResponse(saved,
                reviewEventRepository.findByCompanyApplicationIdOrderByCreatedAtAsc(saved.getId()));
    }

    @Transactional(readOnly = true)
    public PageResponse<CompanyApplicationResponse> search(String keyword, CompanyApplicationStatus status, int page,
            int size) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        var result = companyApplicationRepository
                .findAll(CompanyApplicationSpecifications.search(keyword, status), pageable)
                .map(application -> companyApplicationMapper.toResponse(
                        application,
                        reviewEventRepository.findByCompanyApplicationIdOrderByCreatedAtAsc(application.getId())));
        return PageResponse.from(result);
    }

    @Transactional(readOnly = true)
    public CompanyApplicationResponse getById(Long applicationId) {
        CompanyApplication application = findApplication(applicationId);
        return companyApplicationMapper.toResponse(
                application,
                reviewEventRepository.findByCompanyApplicationIdOrderByCreatedAtAsc(applicationId));
    }

    @Transactional
    @Retryable(
            retryFor = {
                    DeadlockLoserDataAccessException.class,
                    CannotAcquireLockException.class,
                    PessimisticLockingFailureException.class,
                    LockAcquisitionException.class
            },
            maxAttempts = 3,
            backoff = @Backoff(delay = 200, multiplier = 2.0))
    public CompanyApplicationResponse moveToUnderReview(Long applicationId, CompanyApplicationReviewRequest request) {
        CompanyApplication application = findApplicationForUpdate(applicationId);
        CompanyApplicationStatusWorkflow.ensureCanMoveToUnderReview(application.getStatus());
        CompanyApplicationStatus previousStatus = application.getStatus();
        var oldSnapshot = snapshot(application);
        application.setStatus(CompanyApplicationStatus.UNDER_REVIEW);
        application.setReviewNotes(trim(request.reviewNotes()));
        CompanyApplication saved = companyApplicationRepository.saveAndFlush(application);
        reviewEventRepository
                .save(buildEvent(saved, CompanyApplicationReviewAction.MOVED_TO_UNDER_REVIEW, previousStatus,
                        CompanyApplicationStatus.UNDER_REVIEW, request.reviewNotes()));
        auditLogService.record(new AuditLogCommand(
                null,
                saved.getApprovedTenantId(),
                "COMPANY_APPLICATION",
                "REVIEWED",
                "COMPANY_APPLICATION",
                saved.getId().toString(),
                "Company application " + saved.getApplicationNumber() + " moved to under review.",
                oldSnapshot,
                snapshot(saved)));
        return companyApplicationMapper.toResponse(saved,
                reviewEventRepository.findByCompanyApplicationIdOrderByCreatedAtAsc(applicationId));
    }

    @Transactional
    @Retryable(
            retryFor = {
                    DeadlockLoserDataAccessException.class,
                    CannotAcquireLockException.class,
                    PessimisticLockingFailureException.class,
                    LockAcquisitionException.class
            },
            maxAttempts = 3,
            backoff = @Backoff(delay = 200, multiplier = 2.0))
    public CompanyApplicationResponse approve(Long applicationId, CompanyApplicationReviewRequest request) {
        CompanyApplication application = findApplicationForUpdate(applicationId);
        CompanyApplicationStatusWorkflow.ensureCanApprove(application.getStatus());
        CompanyApplicationStatus previousStatus = application.getStatus();
        var oldSnapshot = snapshot(application);
        CompanyApplicationApprovalService.ApprovalResult approvalResult = approvalService.approve(application, request);
        application.setApprovedTenantId(approvalResult.tenantId());
        application.setOwnerUserId(approvalResult.ownerUserId());
        application.setReviewNotes(trim(request.reviewNotes()));
        application.setRejectionReason(null);
        application.setStatus(CompanyApplicationStatus.APPROVED);
        CompanyApplication saved = companyApplicationRepository.saveAndFlush(application);
        reviewEventRepository.save(buildEvent(saved, CompanyApplicationReviewAction.APPROVED, previousStatus,
                CompanyApplicationStatus.APPROVED, request.reviewNotes()));
        auditLogService.record(new AuditLogCommand(
                null,
                saved.getApprovedTenantId(),
                "COMPANY_APPLICATION",
                "APPROVED",
                "COMPANY_APPLICATION",
                saved.getId().toString(),
                "Company application " + saved.getApplicationNumber() + " was approved.",
                oldSnapshot,
                snapshot(saved)));
        notificationPort.applicationApproved(saved);
        return companyApplicationMapper.toResponse(saved,
                reviewEventRepository.findByCompanyApplicationIdOrderByCreatedAtAsc(applicationId));
    }

    @Transactional
    @Retryable(
            retryFor = {
                    DeadlockLoserDataAccessException.class,
                    CannotAcquireLockException.class,
                    PessimisticLockingFailureException.class,
                    LockAcquisitionException.class
            },
            maxAttempts = 3,
            backoff = @Backoff(delay = 200, multiplier = 2.0))
    public CompanyApplicationResponse reject(Long applicationId, CompanyApplicationReviewRequest request) {
        CompanyApplication application = findApplicationForUpdate(applicationId);
        CompanyApplicationStatusWorkflow.ensureCanReject(application.getStatus(), request.rejectionReason());
        CompanyApplicationStatus previousStatus = application.getStatus();
        var oldSnapshot = snapshot(application);
        application.setReviewNotes(trim(request.reviewNotes()));
        application.setRejectionReason(trim(request.rejectionReason()));
        application.setStatus(CompanyApplicationStatus.REJECTED);
        CompanyApplication saved = companyApplicationRepository.saveAndFlush(application);
        reviewEventRepository.save(buildEvent(saved, CompanyApplicationReviewAction.REJECTED, previousStatus,
                CompanyApplicationStatus.REJECTED, request.rejectionReason()));
        auditLogService.record(new AuditLogCommand(
                null,
                null,
                "COMPANY_APPLICATION",
                "REJECTED",
                "COMPANY_APPLICATION",
                saved.getId().toString(),
                "Company application " + saved.getApplicationNumber() + " was rejected.",
                oldSnapshot,
                snapshot(saved)));
        notificationPort.applicationRejected(saved);
        return companyApplicationMapper.toResponse(saved,
                reviewEventRepository.findByCompanyApplicationIdOrderByCreatedAtAsc(applicationId));
    }

    private CompanyApplication findApplication(Long applicationId) {
        return companyApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new ApiException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        HttpStatus.NOT_FOUND,
                        "Company application was not found."));
    }

    private CompanyApplication findApplicationForUpdate(Long applicationId) {
        return companyApplicationRepository.findWithWriteLockById(applicationId)
                .orElseThrow(() -> new ApiException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        HttpStatus.NOT_FOUND,
                        "Company application was not found."));
    }

    private CompanyApplicationReviewEvent buildEvent(CompanyApplication application,
            CompanyApplicationReviewAction action,
            CompanyApplicationStatus fromStatus,
            CompanyApplicationStatus toStatus,
            String notes) {
        CompanyApplicationReviewEvent event = new CompanyApplicationReviewEvent();
        event.setCompanyApplicationId(application.getId());
        event.setAction(action);
        event.setFromStatus(fromStatus);
        event.setToStatus(toStatus);
        event.setNotes(trim(notes));
        return event;
    }

    private String generateApplicationNumber(Long id) {
        YearMonth yearMonth = YearMonth.now();
        return "APP-" + yearMonth.getYear() + String.format("%02d", yearMonth.getMonthValue()) + "-"
                + String.format("%06d", id);
    }

    private String trim(String value) {
        return value == null ? null : value.trim();
    }

    private Object snapshot(CompanyApplication application) {
        java.util.Map<String, Object> values = new java.util.LinkedHashMap<>();
        values.put("id", application.getId());
        values.put("applicationNumber", application.getApplicationNumber());
        values.put("legalCompanyName", application.getLegalCompanyName());
        values.put("status", application.getStatus() == null ? null : application.getStatus().name());
        values.put("approvedTenantId", application.getApprovedTenantId());
        return values;
    }
}
