package com.transportplatform.tms.features.rider.application;

import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.audit.application.AuditLogCommand;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.rider.api.request.GuardianUpsertRequest;
import com.transportplatform.tms.features.rider.api.response.GuardianLinkedRiderResponse;
import com.transportplatform.tms.features.rider.api.response.GuardianResponse;
import com.transportplatform.tms.features.rider.domain.Guardian;
import com.transportplatform.tms.features.rider.domain.GuardianRepository;
import com.transportplatform.tms.features.rider.domain.GuardianStatus;
import com.transportplatform.tms.features.rider.domain.RiderGuardian;
import com.transportplatform.tms.features.rider.domain.RiderGuardianRepository;
import com.transportplatform.tms.features.rider.domain.RiderGuardianStatus;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GuardianService {

    private final GuardianRepository guardianRepository;
    private final RiderGuardianRepository riderGuardianRepository;
    private final GuardianMapper guardianMapper;
    private final RiderGuardianMapper riderGuardianMapper;
    private final GuardianAccessService guardianAccessService;
    private final AuditLogService auditLogService;

    public GuardianService(GuardianRepository guardianRepository,
            RiderGuardianRepository riderGuardianRepository,
            GuardianMapper guardianMapper,
            RiderGuardianMapper riderGuardianMapper,
            GuardianAccessService guardianAccessService,
            AuditLogService auditLogService) {
        this.guardianRepository = guardianRepository;
        this.riderGuardianRepository = riderGuardianRepository;
        this.guardianMapper = guardianMapper;
        this.riderGuardianMapper = riderGuardianMapper;
        this.guardianAccessService = guardianAccessService;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public PageResponse<GuardianResponse> searchCompanyGuardians(String keyword,
            GuardianStatus status,
            Boolean authorizedForPickup,
            Boolean billingContact,
            int page,
            int size,
            String sortBy,
            Sort.Direction sortDirection) {
        String tenantId = guardianAccessService.requireCompanyTenantId();
        var pageable = PageRequest.of(page, size, Sort.by(sortDirection, resolveSortField(sortBy)));
        var result = guardianRepository.findAll(
                GuardianSpecifications.search(tenantId, keyword, status, authorizedForPickup, billingContact),
                pageable);
        Map<Long, List<RiderGuardian>> relationshipsByGuardianId = loadActiveRelationshipsByGuardianId(tenantId,
                result.getContent());
        return PageResponse.from(result.map(guardian -> toResponse(
                guardian,
                relationshipsByGuardianId.getOrDefault(guardian.getId(), List.of()),
                false)));
    }

    @Transactional(readOnly = true)
    public GuardianResponse getCompanyGuardian(Long guardianId) {
        Guardian guardian = guardianAccessService.findGuardianForCompanyScope(guardianId);
        List<RiderGuardian> relationships = riderGuardianRepository
                .findAllByTenantIdAndGuardian_IdAndStatusOrderByPrimaryGuardianDescUpdatedAtDesc(
                        guardian.getTenantId(),
                        guardian.getId(),
                        RiderGuardianStatus.ACTIVE);
        return toResponse(guardian, relationships, true);
    }

    @Transactional
    public GuardianResponse createCompanyGuardian(GuardianUpsertRequest request) {
        String tenantId = guardianAccessService.requireCompanyTenantId();
        Guardian guardian = new Guardian();
        guardian.setTenantId(tenantId);
        guardian.setStatus(GuardianStatus.PENDING);
        guardianMapper.apply(guardian, request);
        Guardian saved = guardianRepository.save(guardian);
        recordAudit(saved, "CREATED", "Guardian " + saved.getFirstName() + " " + saved.getLastName() + " was created.",
                null, snapshot(saved));
        return toResponse(saved, List.of(), true);
    }

    @Transactional
    public GuardianResponse updateCompanyGuardian(Long guardianId, GuardianUpsertRequest request) {
        Guardian guardian = guardianAccessService.findGuardianForCompanyScope(guardianId);
        Object oldSnapshot = snapshot(guardian);
        guardianMapper.apply(guardian, request);
        Guardian saved = guardianRepository.save(guardian);
        recordAudit(saved, "UPDATED", "Guardian " + saved.getFirstName() + " " + saved.getLastName() + " was updated.",
                oldSnapshot, snapshot(saved));
        List<RiderGuardian> relationships = riderGuardianRepository
                .findAllByTenantIdAndGuardian_IdAndStatusOrderByPrimaryGuardianDescUpdatedAtDesc(
                        saved.getTenantId(),
                        saved.getId(),
                        RiderGuardianStatus.ACTIVE);
        return toResponse(saved, relationships, true);
    }

    @Transactional
    public GuardianResponse activateCompanyGuardian(Long guardianId) {
        Guardian guardian = guardianAccessService.findGuardianForCompanyScope(guardianId);
        GuardianStatusWorkflow.ensureCanActivate(guardian.getStatus());
        return updateStatus(guardian, GuardianStatus.ACTIVE, "ACTIVATED",
                "Guardian " + guardian.getFirstName() + " " + guardian.getLastName() + " was activated.");
    }

    @Transactional
    public GuardianResponse suspendCompanyGuardian(Long guardianId) {
        Guardian guardian = guardianAccessService.findGuardianForCompanyScope(guardianId);
        GuardianStatusWorkflow.ensureCanSuspend(guardian.getStatus());
        return updateStatus(guardian, GuardianStatus.SUSPENDED, "SUSPENDED",
                "Guardian " + guardian.getFirstName() + " " + guardian.getLastName() + " was suspended.");
    }

    @Transactional
    public GuardianResponse deactivateCompanyGuardian(Long guardianId) {
        Guardian guardian = guardianAccessService.findGuardianForCompanyScope(guardianId);
        GuardianStatusWorkflow.ensureCanDeactivate(guardian.getStatus());
        return updateStatus(guardian, GuardianStatus.INACTIVE, "DEACTIVATED",
                "Guardian " + guardian.getFirstName() + " " + guardian.getLastName() + " was marked inactive.");
    }

    private GuardianResponse updateStatus(Guardian guardian, GuardianStatus status, String action, String summary) {
        Object oldSnapshot = snapshot(guardian);
        guardian.setStatus(status);
        Guardian saved = guardianRepository.save(guardian);
        recordAudit(saved, action, summary, oldSnapshot, snapshot(saved));
        List<RiderGuardian> relationships = riderGuardianRepository
                .findAllByTenantIdAndGuardian_IdAndStatusOrderByPrimaryGuardianDescUpdatedAtDesc(
                        saved.getTenantId(),
                        saved.getId(),
                        RiderGuardianStatus.ACTIVE);
        return toResponse(saved, relationships, true);
    }

    private GuardianResponse toResponse(Guardian guardian, List<RiderGuardian> relationships,
            boolean includeRelationships) {
        List<GuardianLinkedRiderResponse> riders = includeRelationships
                ? relationships.stream().map(riderGuardianMapper::toGuardianLinkedRiderResponse).toList()
                : List.of();
        return guardianMapper.toResponse(guardian, relationships.size(), riders);
    }

    private Map<Long, List<RiderGuardian>> loadActiveRelationshipsByGuardianId(String tenantId,
            Collection<Guardian> guardians) {
        if (guardians.isEmpty()) {
            return Map.of();
        }
        return riderGuardianRepository
                .findAllByTenantIdAndGuardian_IdInAndStatusOrderByPrimaryGuardianDescUpdatedAtDesc(
                        tenantId,
                        guardians.stream().map(Guardian::getId).toList(),
                        RiderGuardianStatus.ACTIVE)
                .stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        relationship -> relationship.getGuardian().getId(),
                        LinkedHashMap::new,
                        java.util.stream.Collectors.toList()));
    }

    private void recordAudit(Guardian guardian, String action, String summary, Object oldValue, Object newValue) {
        auditLogService.record(new AuditLogCommand(
                null,
                guardian.getTenantId(),
                "GUARDIAN",
                action,
                "GUARDIAN",
                resolveEntityId(guardian),
                summary,
                oldValue,
                newValue));
    }

    private String resolveEntityId(Guardian guardian) {
        if (guardian.getId() != null) {
            return guardian.getId().toString();
        }
        return guardian.getFirstName() + ":" + guardian.getLastName();
    }

    private Object snapshot(Guardian guardian) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("id", guardian.getId());
        values.put("tenantId", guardian.getTenantId());
        values.put("firstName", guardian.getFirstName());
        values.put("lastName", guardian.getLastName());
        values.put("phone", guardian.getPhone());
        values.put("email", guardian.getEmail());
        values.put("authorizedForPickup", guardian.isAuthorizedForPickup());
        values.put("billingContact", guardian.isBillingContact());
        values.put("status", guardian.getStatus() == null ? null : guardian.getStatus().name());
        return values;
    }

    private String resolveSortField(String sortBy) {
        String resolved = sortBy == null ? "updatedAt" : sortBy;
        return switch (resolved) {
            case "createdAt", "updatedAt", "firstName", "lastName", "phone", "email", "status" -> resolved;
            default -> "updatedAt";
        };
    }
}