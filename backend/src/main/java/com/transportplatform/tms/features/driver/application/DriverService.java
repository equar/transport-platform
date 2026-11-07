package com.transportplatform.tms.features.driver.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.audit.application.AuditLogCommand;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.driver.api.request.DriverUpsertRequest;
import com.transportplatform.tms.features.driver.api.response.DriverComplianceSummaryResponse;
import com.transportplatform.tms.features.driver.api.response.DriverResponse;
import com.transportplatform.tms.features.driver.domain.Driver;
import com.transportplatform.tms.features.driver.domain.DriverComplianceStatus;
import com.transportplatform.tms.features.driver.domain.DriverRepository;
import com.transportplatform.tms.features.driver.domain.DriverStatus;
import com.transportplatform.tms.features.driver.domain.DriverTrainingStatus;
import com.transportplatform.tms.features.driver.domain.DriverType;
import com.transportplatform.tms.features.notification.application.NotificationEventService;
import java.time.Clock;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DriverService {

    private final DriverRepository driverRepository;
    private final DriverMapper driverMapper;
    private final DriverAccessService driverAccessService;
    private final DriverCodeGenerator driverCodeGenerator;
    private final DriverComplianceSummaryService driverComplianceSummaryService;
    private final AuditLogService auditLogService;
    private final NotificationEventService notificationEventService;
    private final Clock clock;

    public DriverService(DriverRepository driverRepository,
            DriverMapper driverMapper,
            DriverAccessService driverAccessService,
            DriverCodeGenerator driverCodeGenerator,
            DriverComplianceSummaryService driverComplianceSummaryService,
            AuditLogService auditLogService,
            NotificationEventService notificationEventService,
            Clock clock) {
        this.driverRepository = driverRepository;
        this.driverMapper = driverMapper;
        this.driverAccessService = driverAccessService;
        this.driverCodeGenerator = driverCodeGenerator;
        this.driverComplianceSummaryService = driverComplianceSummaryService;
        this.auditLogService = auditLogService;
        this.notificationEventService = notificationEventService;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public PageResponse<DriverResponse> searchCompanyDrivers(String keyword,
            DriverStatus status,
            DriverType driverType,
            int page,
            int size,
            String sortBy,
            Sort.Direction sortDirection) {
        String tenantId = driverAccessService.requireCompanyTenantId();
        var pageable = PageRequest.of(page, size, Sort.by(sortDirection, resolveSortField(sortBy)));
        var result = driverRepository.findAll(DriverSpecifications.search(tenantId, keyword, status, driverType),
                pageable);
        Map<Long, DriverComplianceSummaryResponse> summaries = driverComplianceSummaryService
                .getSummaries(tenantId, result.getContent());
        return PageResponse.from(result.map(driver -> driverMapper.toResponse(
                driver,
                summaries.getOrDefault(driver.getId(), driverComplianceSummaryService.getSummary(tenantId, driver)))));
    }

    @Transactional(readOnly = true)
    public DriverResponse getCompanyDriver(Long driverId) {
        Driver driver = driverAccessService.findDriverForCompanyScope(driverId);
        return driverMapper.toResponse(
                driver,
                driverComplianceSummaryService.getSummary(driver.getTenantId(), driver));
    }

    @Transactional
    public DriverResponse createCompanyDriver(DriverUpsertRequest request) {
        String tenantId = driverAccessService.requireCompanyTenantId();
        Driver driver = new Driver();
        driver.setTenantId(tenantId);
        driver.setDriverCode(driverCodeGenerator.generate(tenantId));
        driver.setStatus(DriverStatus.PENDING_REVIEW);
        driverMapper.apply(driver, request);
        validateBusinessRules(driver, null);
        Driver saved = driverRepository.save(driver);
        recordAudit(saved, "CREATED", "Driver " + saved.getDriverCode() + " was created.", null, snapshot(saved));
        return driverMapper.toResponse(saved, driverComplianceSummaryService.getSummary(tenantId, saved));
    }

    @Transactional
    public DriverResponse updateCompanyDriver(Long driverId, DriverUpsertRequest request) {
        Driver driver = driverAccessService.findDriverForCompanyScope(driverId);
        Object oldSnapshot = snapshot(driver);
        driverMapper.apply(driver, request);
        validateBusinessRules(driver, driver.getId());
        Driver saved = driverRepository.save(driver);
        recordAudit(saved, "UPDATED", "Driver " + saved.getDriverCode() + " was updated.", oldSnapshot,
                snapshot(saved));
        return driverMapper.toResponse(saved, driverComplianceSummaryService.getSummary(saved.getTenantId(), saved));
    }

    @Transactional
    public DriverResponse reviewCompanyDriver(Long driverId) {
        Driver driver = driverAccessService.findDriverForCompanyScope(driverId);
        DriverStatusWorkflow.ensureCanReview(driver.getStatus());
        return updateStatus(driver, DriverStatus.DOCUMENT_PENDING, "REVIEWED",
                "Driver " + driver.getDriverCode() + " was reviewed and moved into document collection.");
    }

    @Transactional
    public DriverResponse completeCompanyDriverDocuments(Long driverId) {
        Driver driver = driverAccessService.findDriverForCompanyScope(driverId);
        DriverStatusWorkflow.ensureCanCompleteDocuments(driver.getStatus());
        DriverComplianceSummaryResponse complianceSummary = driverComplianceSummaryService
                .getSummary(driver.getTenantId(), driver);
        if (complianceSummary.overallStatus() != DriverComplianceStatus.COMPLIANT) {
            String missing = complianceSummary.missingRequiredDocumentTypes().stream()
                    .map(type -> type.name().replace('_', ' '))
                    .sorted()
                    .collect(java.util.stream.Collectors.joining(", "));
            String reason = complianceSummary.missingRequiredDocumentCount() > 0
                    ? "Missing required documents: " + missing + "."
                : complianceSummary.expiredDocumentCount() > 0
                    ? complianceSummary.expiredDocumentCount() + " required document(s) are expired."
                    : "Required documents are still awaiting verification.";
            throw new ApiException(
                    ErrorCode.INVALID_STATUS_TRANSITION,
                    HttpStatus.BAD_REQUEST,
                    "Document review cannot be completed. " + reason);
        }
        DriverStatus targetStatus = DriverStatusWorkflow.resolvePostDocumentStatus(driver);
        return updateStatus(driver, targetStatus, "DOCUMENTS_READY",
                targetStatus == DriverStatus.ACTIVE
                        ? "Driver " + driver.getDriverCode() + " completed document collection and is now active."
                        : "Driver " + driver.getDriverCode()
                                + " completed document collection and is ready for training.");
    }

    @Transactional
    public DriverResponse activateCompanyDriver(Long driverId) {
        Driver driver = driverAccessService.findDriverForCompanyScope(driverId);
        DriverComplianceSummaryResponse complianceSummary = driverComplianceSummaryService
                .getSummary(driver.getTenantId(), driver);
        DriverStatusWorkflow.ensureCanActivate(driver);
        validateActivationReadiness(driver, complianceSummary);
        return updateStatus(driver, DriverStatus.ACTIVE, "ACTIVATED",
                "Driver " + driver.getDriverCode() + " was activated.");
    }

    @Transactional
    public DriverResponse suspendCompanyDriver(Long driverId) {
        Driver driver = driverAccessService.findDriverForCompanyScope(driverId);
        DriverStatusWorkflow.ensureCanSuspend(driver.getStatus());
        return updateStatus(driver, DriverStatus.SUSPENDED, "SUSPENDED",
                "Driver " + driver.getDriverCode() + " was suspended.");
    }

    @Transactional
    public DriverResponse deactivateCompanyDriver(Long driverId) {
        Driver driver = driverAccessService.findDriverForCompanyScope(driverId);
        DriverStatusWorkflow.ensureCanDeactivate(driver.getStatus());
        return updateStatus(driver, DriverStatus.INACTIVE, "DEACTIVATED",
                "Driver " + driver.getDriverCode() + " was marked inactive.");
    }

    @Transactional
    public DriverResponse terminateCompanyDriver(Long driverId) {
        Driver driver = driverAccessService.findDriverForCompanyScope(driverId);
        DriverStatusWorkflow.ensureCanTerminate(driver.getStatus());
        return updateStatus(driver, DriverStatus.TERMINATED, "TERMINATED",
                "Driver " + driver.getDriverCode() + " was terminated.");
    }

    private DriverResponse updateStatus(Driver driver, DriverStatus status, String action, String summary) {
        Object oldSnapshot = snapshot(driver);
        DriverStatus previousStatus = driver.getStatus();
        driver.setStatus(status);
        Driver saved = driverRepository.save(driver);
        recordAudit(saved, action, summary, oldSnapshot, snapshot(saved));
        notificationEventService.publishDriverStatusChanged(saved, previousStatus, saved.getStatus());
        return driverMapper.toResponse(saved, driverComplianceSummaryService.getSummary(saved.getTenantId(), saved));
    }

    private void validateBusinessRules(Driver driver, Long currentDriverId) {
        if (driver.getEmail() != null) {
            boolean emailConflict = currentDriverId == null
                    ? driverRepository.existsByTenantIdAndEmailIgnoreCase(driver.getTenantId(), driver.getEmail())
                    : driverRepository.existsByTenantIdAndEmailIgnoreCaseAndIdNot(driver.getTenantId(),
                            driver.getEmail(), currentDriverId);
            if (emailConflict) {
                throw new ApiException(
                        ErrorCode.RESOURCE_CONFLICT,
                        HttpStatus.CONFLICT,
                        "A driver with the same email already exists for this tenant.");
            }
        }
        if (driver.getDateOfBirth() != null && driver.getDateOfBirth().isAfter(LocalDate.now(clock))) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "Date of birth cannot be in the future.");
        }
        if (driver.getHireDate() != null && driver.getStartDate() != null
                && driver.getStartDate().isBefore(driver.getHireDate())) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "Start date cannot be earlier than hire date.");
        }
        if (driver.getTrainingStatus() == DriverTrainingStatus.COMPLETED
                && driver.getTrainingCompletionDate() == null) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "Training completion date is required when training is completed.");
        }
        if (driver.getTrainingCompletionDate() != null
                && driver.getTrainingStatus() != DriverTrainingStatus.COMPLETED) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "Training completion date can be recorded only when training is completed.");
        }
    }

    private void validateActivationReadiness(Driver driver, DriverComplianceSummaryResponse complianceSummary) {
        if (driver.getLicenseNumber() == null || driver.getLicenseNumber().isBlank()) {
            throw new ApiException(
                    ErrorCode.INVALID_STATUS_TRANSITION,
                    HttpStatus.BAD_REQUEST,
                    "License number is required before activating a driver.");
        }
        if (driver.getLicenseExpiryDate() == null || driver.getLicenseExpiryDate().isBefore(LocalDate.now(clock))) {
            throw new ApiException(
                    ErrorCode.INVALID_STATUS_TRANSITION,
                    HttpStatus.BAD_REQUEST,
                    "An active driver must have a current license expiry date.");
        }
        if (complianceSummary.overallStatus() == DriverComplianceStatus.NON_COMPLIANT) {
            throw new ApiException(
                    ErrorCode.INVALID_STATUS_TRANSITION,
                    HttpStatus.BAD_REQUEST,
                    "Driver compliance requirements must be satisfied before activation.");
        }
    }

    private void recordAudit(Driver driver, String action, String summary, Object oldValue, Object newValue) {
        auditLogService.record(new AuditLogCommand(
                null,
                driver.getTenantId(),
                "DRIVER",
                action,
                "DRIVER",
                resolveEntityId(driver),
                summary,
                oldValue,
                newValue));
    }

    private String resolveEntityId(Driver driver) {
        if (driver.getId() != null) {
            return driver.getId().toString();
        }
        return driver.getDriverCode();
    }

    private Object snapshot(Driver driver) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("id", driver.getId());
        values.put("driverCode", driver.getDriverCode());
        values.put("tenantId", driver.getTenantId());
        values.put("status", driver.getStatus() == null ? null : driver.getStatus().name());
        values.put("firstName", driver.getFirstName());
        values.put("lastName", driver.getLastName());
        values.put("email", driver.getEmail());
        values.put("phone", driver.getPhone());
        values.put("driverType", driver.getDriverType() == null ? null : driver.getDriverType().name());
        values.put("licenseNumber", driver.getLicenseNumber());
        values.put("licenseExpiryDate", driver.getLicenseExpiryDate());
        values.put("trainingStatus", driver.getTrainingStatus() == null ? null : driver.getTrainingStatus().name());
        return values;
    }

    private String resolveSortField(String sortBy) {
        String resolved = sortBy == null ? "updatedAt" : sortBy;
        return switch (resolved) {
            case "createdAt", "updatedAt", "driverCode", "firstName", "lastName", "status", "licenseExpiryDate" ->
                resolved;
            default -> "updatedAt";
        };
    }
}
