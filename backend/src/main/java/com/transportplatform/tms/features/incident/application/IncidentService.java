package com.transportplatform.tms.features.incident.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.features.audit.application.AuditLogCommand;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.incident.api.request.IncidentStatusActionRequest;
import com.transportplatform.tms.features.incident.api.request.IncidentUpsertRequest;
import com.transportplatform.tms.features.incident.api.response.IncidentDetailResponse;
import com.transportplatform.tms.features.incident.api.response.IncidentReferenceDataResponse;
import com.transportplatform.tms.features.incident.api.response.IncidentSummaryResponse;
import com.transportplatform.tms.features.incident.domain.Incident;
import com.transportplatform.tms.features.incident.domain.IncidentRepository;
import com.transportplatform.tms.features.incident.domain.IncidentSeverity;
import com.transportplatform.tms.features.incident.domain.IncidentStatus;
import com.transportplatform.tms.features.incident.domain.IncidentType;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class IncidentService {

    private static final EnumSet<IncidentStatus> OPEN_STATUSES = EnumSet.of(
            IncidentStatus.OPEN,
            IncidentStatus.IN_REVIEW,
            IncidentStatus.ESCALATED);

    private final IncidentRepository incidentRepository;
    private final IncidentAccessService incidentAccessService;
    private final IncidentReferenceValidationService incidentReferenceValidationService;
    private final IncidentCodeGenerator incidentCodeGenerator;
    private final IncidentMapper incidentMapper;
    private final AuditLogService auditLogService;
    private final Clock clock;

    public IncidentService(IncidentRepository incidentRepository,
            IncidentAccessService incidentAccessService,
            IncidentReferenceValidationService incidentReferenceValidationService,
            IncidentCodeGenerator incidentCodeGenerator,
            IncidentMapper incidentMapper,
            AuditLogService auditLogService,
            Clock clock) {
        this.incidentRepository = incidentRepository;
        this.incidentAccessService = incidentAccessService;
        this.incidentReferenceValidationService = incidentReferenceValidationService;
        this.incidentCodeGenerator = incidentCodeGenerator;
        this.incidentMapper = incidentMapper;
        this.auditLogService = auditLogService;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public PageResponse<IncidentSummaryResponse> searchCompanyIncidents(String keyword,
            IncidentStatus status,
            IncidentSeverity severity,
            IncidentType incidentType,
            Long assignedToUserId,
            LocalDate fromDate,
            LocalDate toDate,
            int page,
            int size,
            String sortBy,
            Sort.Direction sortDirection) {
        AuthenticatedUser user = incidentAccessService.requireCompanyAdmin();
        return PageResponse.from(incidentRepository.findAll(
                IncidentSpecifications.search(
                        user.tenantId(),
                        keyword,
                        status,
                        severity,
                        incidentType,
                        assignedToUserId,
                        fromDate == null ? null : fromDate.atStartOfDay().toInstant(ZoneOffset.UTC),
                        toDate == null ? null : toDate.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC)),
                PageRequest.of(page, size, Sort.by(sortDirection, resolveSortField(sortBy))))
                .map(incidentMapper::toSummary));
    }

    @Transactional(readOnly = true)
    public IncidentDetailResponse getCompanyIncident(Long incidentId) {
        return incidentMapper.toDetail(incidentAccessService.findCompanyIncident(incidentId));
    }

    @Transactional(readOnly = true)
    public IncidentReferenceDataResponse getReferenceData() {
        return incidentMapper.toReferenceData(incidentAccessService.requireCompanyAdmin().tenantId());
    }

    @Transactional
    public IncidentDetailResponse createCompanyIncident(IncidentUpsertRequest request) {
        AuthenticatedUser user = incidentAccessService.requireCompanyAdmin();
        validateUpsertRequest(request, true);
        incidentReferenceValidationService.validate(
                user.tenantId(),
                request.relatedRideId(),
                request.relatedDriverId(),
                request.relatedVehicleId(),
                request.relatedRiderId(),
                request.relatedGuardianId(),
                request.relatedOrganizationId(),
                request.assignedToUserId());
        Incident incident = new Incident();
        incident.setTenantId(user.tenantId());
        incident.setIncidentCode(incidentCodeGenerator.generate(user.tenantId()));
        incident.setReportedByUserId(user.id());
        incidentMapper.apply(incident, request, resolveReportedAt(request.reportedAt()),
                resolveReportedByName(user, request.reportedByNameSnapshot()));
        incident.setStatus(resolveInitialStatus(request.status()));
        Incident saved = incidentRepository.save(incident);
        recordAudit(saved, "CREATED", "Incident " + saved.getIncidentCode() + " was created.", null, snapshot(saved));
        return incidentMapper.toDetail(saved);
    }

    @Transactional
    public IncidentDetailResponse updateCompanyIncident(Long incidentId, IncidentUpsertRequest request) {
        Incident incident = incidentAccessService.findCompanyIncident(incidentId);
        IncidentStatusWorkflow.ensureCanUpdate(incident);
        validateUpsertRequest(request, false);
        incidentReferenceValidationService.validate(
                incident.getTenantId(),
                request.relatedRideId(),
                request.relatedDriverId(),
                request.relatedVehicleId(),
                request.relatedRiderId(),
                request.relatedGuardianId(),
                request.relatedOrganizationId(),
                request.assignedToUserId());
        Object oldSnapshot = snapshot(incident);
        incidentMapper.apply(incident, request, resolveReportedAt(request.reportedAt()),
                resolveReportedByName(incidentAccessService.requireCompanyAdmin(), request.reportedByNameSnapshot()));
        Incident saved = incidentRepository.save(incident);
        recordAudit(saved, "UPDATED", "Incident " + saved.getIncidentCode() + " was updated.", oldSnapshot,
                snapshot(saved));
        return incidentMapper.toDetail(saved);
    }

    @Transactional
    public IncidentDetailResponse moveToInReview(Long incidentId, IncidentStatusActionRequest request) {
        Incident incident = incidentAccessService.findCompanyIncident(incidentId);
        IncidentStatusWorkflow.ensureCanMoveToInReview(incident);
        return changeStatus(incident, IncidentStatus.IN_REVIEW, "MOVED_TO_IN_REVIEW", request);
    }

    @Transactional
    public IncidentDetailResponse escalate(Long incidentId, IncidentStatusActionRequest request) {
        Incident incident = incidentAccessService.findCompanyIncident(incidentId);
        IncidentStatusWorkflow.ensureCanEscalate(incident);
        return changeStatus(incident, IncidentStatus.ESCALATED, "ESCALATED", request);
    }

    @Transactional
    public IncidentDetailResponse resolve(Long incidentId, IncidentStatusActionRequest request) {
        Incident incident = incidentAccessService.findCompanyIncident(incidentId);
        IncidentStatusWorkflow.ensureCanResolve(incident);
        if (request == null || request.resolutionSummary() == null || request.resolutionSummary().isBlank()) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST,
                    "Resolution summary is required when resolving an incident.");
        }
        return changeStatus(incident, IncidentStatus.RESOLVED, "RESOLVED", request);
    }

    @Transactional
    public IncidentDetailResponse close(Long incidentId, IncidentStatusActionRequest request) {
        Incident incident = incidentAccessService.findCompanyIncident(incidentId);
        IncidentStatusWorkflow.ensureCanClose(incident);
        return changeStatus(incident, IncidentStatus.CLOSED, "CLOSED", request);
    }

    @Transactional
    public IncidentDetailResponse dismiss(Long incidentId, IncidentStatusActionRequest request) {
        Incident incident = incidentAccessService.findCompanyIncident(incidentId);
        IncidentStatusWorkflow.ensureCanDismiss(incident);
        return changeStatus(incident, IncidentStatus.DISMISSED, "DISMISSED", request);
    }

    @Transactional
    public IncidentDetailResponse reopen(Long incidentId, IncidentStatusActionRequest request) {
        Incident incident = incidentAccessService.findCompanyIncident(incidentId);
        IncidentStatusWorkflow.ensureCanReopen(incident);
        return changeStatus(incident, IncidentStatus.IN_REVIEW, "REOPENED", request);
    }

    @Transactional(readOnly = true)
    public long countOpenIncidents(String tenantId) {
        return incidentRepository.countByTenantIdAndStatusIn(tenantId, OPEN_STATUSES);
    }

    @Transactional(readOnly = true)
    public long countCriticalOpenIncidents(String tenantId) {
        return incidentRepository.countByTenantIdAndSeverityAndStatusIn(tenantId, IncidentSeverity.CRITICAL,
                OPEN_STATUSES);
    }

    @Transactional(readOnly = true)
    public long countResolvedIncidents(String tenantId) {
        return incidentRepository.countByTenantIdAndStatusIn(tenantId, EnumSet.of(IncidentStatus.RESOLVED));
    }

    private IncidentDetailResponse changeStatus(Incident incident,
            IncidentStatus targetStatus,
            String action,
            IncidentStatusActionRequest request) {
        Object oldSnapshot = snapshot(incident);
        if (request != null) {
            if (request.resolutionSummary() != null) {
                incident.setResolutionSummary(trimToNull(request.resolutionSummary()));
            }
            if (request.rootCauseSummary() != null) {
                incident.setRootCauseSummary(trimToNull(request.rootCauseSummary()));
            }
            if (request.correctiveActionSummary() != null) {
                incident.setCorrectiveActionSummary(trimToNull(request.correctiveActionSummary()));
            }
            if (request.notes() != null) {
                incident.setNotes(trimToNull(request.notes()));
            }
        }
        incident.setStatus(targetStatus);
        Incident saved = incidentRepository.save(incident);
        recordAudit(saved, action, "Incident " + saved.getIncidentCode() + " moved to " + targetStatus.name() + ".",
                oldSnapshot, snapshot(saved));
        return incidentMapper.toDetail(saved);
    }

    private void validateUpsertRequest(IncidentUpsertRequest request, boolean creating) {
        if (creating && request.status() == IncidentStatus.CLOSED) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST,
                    "Incident cannot be created directly in CLOSED status.");
        }
        if (request.status() == IncidentStatus.RESOLVED
                && (request.resolutionSummary() == null || request.resolutionSummary().isBlank())) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST,
                    "Resolution summary is required when saving an incident as resolved.");
        }
    }

    private IncidentStatus resolveInitialStatus(IncidentStatus requestedStatus) {
        return requestedStatus == null ? IncidentStatus.OPEN : requestedStatus;
    }

    private Instant resolveReportedAt(Instant reportedAt) {
        return reportedAt == null ? Instant.now(clock) : reportedAt;
    }

    private String resolveReportedByName(AuthenticatedUser user, String requestedValue) {
        if (requestedValue != null && !requestedValue.isBlank()) {
            return requestedValue.trim();
        }
        String displayName = java.util.stream.Stream.of(user.firstName(), user.lastName())
                .filter(value -> value != null && !value.isBlank())
                .reduce((left, right) -> left + " " + right)
                .orElse(null);
        return displayName == null || displayName.isBlank() ? user.username() : displayName;
    }

    private void recordAudit(Incident incident, String action, String summary, Object oldValue, Object newValue) {
        auditLogService.record(new AuditLogCommand(
                null,
                incident.getTenantId(),
                "INCIDENT",
                action,
                "INCIDENT",
                incident.getId().toString(),
                summary,
                oldValue,
                newValue));
    }

    private Object snapshot(Incident incident) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("id", incident.getId());
        values.put("incidentCode", incident.getIncidentCode());
        values.put("incidentType", incident.getIncidentType() == null ? null : incident.getIncidentType().name());
        values.put("severity", incident.getSeverity() == null ? null : incident.getSeverity().name());
        values.put("title", incident.getTitle());
        values.put("assignedToUserId", incident.getAssignedToUserId());
        values.put("status", incident.getStatus() == null ? null : incident.getStatus().name());
        return values;
    }

    private String resolveSortField(String sortBy) {
        String resolved = sortBy == null ? "reportedAt" : sortBy;
        return switch (resolved) {
            case "reportedAt", "createdAt", "updatedAt", "incidentCode", "severity", "status", "title" -> resolved;
            default -> "reportedAt";
        };
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}