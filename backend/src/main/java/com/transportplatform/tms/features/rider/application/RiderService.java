package com.transportplatform.tms.features.rider.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.audit.application.AuditLogCommand;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.organization.application.OrganizationValidationService;
import com.transportplatform.tms.features.rider.api.request.RiderUpsertRequest;
import com.transportplatform.tms.features.rider.api.response.RiderGuardianResponse;
import com.transportplatform.tms.features.rider.api.response.RiderResponse;
import com.transportplatform.tms.features.rider.domain.Rider;
import com.transportplatform.tms.features.rider.domain.RiderGuardian;
import com.transportplatform.tms.features.rider.domain.RiderGuardianRepository;
import com.transportplatform.tms.features.rider.domain.RiderGuardianStatus;
import com.transportplatform.tms.features.rider.domain.RiderRepository;
import com.transportplatform.tms.features.rider.domain.RiderStatus;
import com.transportplatform.tms.features.rider.domain.RiderType;
import com.transportplatform.tms.features.saas.application.SubscriptionEnforcementService;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RiderService {

    private final RiderRepository riderRepository;
    private final RiderGuardianRepository riderGuardianRepository;
    private final RiderMapper riderMapper;
    private final RiderGuardianMapper riderGuardianMapper;
    private final RiderAccessService riderAccessService;
    private final RiderCodeGenerator riderCodeGenerator;
    private final OrganizationValidationService organizationValidationService;
    private final AuditLogService auditLogService;
    private final SubscriptionEnforcementService subscriptionEnforcementService;
    private final Clock clock;

    public RiderService(RiderRepository riderRepository,
            RiderGuardianRepository riderGuardianRepository,
            RiderMapper riderMapper,
            RiderGuardianMapper riderGuardianMapper,
            RiderAccessService riderAccessService,
            RiderCodeGenerator riderCodeGenerator,
            OrganizationValidationService organizationValidationService,
            AuditLogService auditLogService,
            SubscriptionEnforcementService subscriptionEnforcementService,
            Clock clock) {
        this.riderRepository = riderRepository;
        this.riderGuardianRepository = riderGuardianRepository;
        this.riderMapper = riderMapper;
        this.riderGuardianMapper = riderGuardianMapper;
        this.riderAccessService = riderAccessService;
        this.riderCodeGenerator = riderCodeGenerator;
        this.organizationValidationService = organizationValidationService;
        this.auditLogService = auditLogService;
        this.subscriptionEnforcementService = subscriptionEnforcementService;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public PageResponse<RiderResponse> searchCompanyRiders(String keyword,
            RiderStatus status,
            RiderType riderType,
            Boolean wheelchairRequired,
            Boolean escortRequired,
            int page,
            int size,
            String sortBy,
            Sort.Direction sortDirection) {
        String tenantId = riderAccessService.requireCompanyTenantId();
        var pageable = PageRequest.of(page, size, Sort.by(sortDirection, resolveSortField(sortBy)));
        var result = riderRepository.findAll(
                RiderSpecifications.search(tenantId, keyword, status, riderType, wheelchairRequired, escortRequired),
                pageable);
        Map<Long, List<RiderGuardian>> relationshipsByRiderId = loadActiveRelationshipsByRiderId(tenantId,
                result.getContent());
        return PageResponse.from(result.map(rider -> toResponse(
                rider,
                relationshipsByRiderId.getOrDefault(rider.getId(), List.of()),
                false)));
    }

    @Transactional(readOnly = true)
    public RiderResponse getCompanyRider(Long riderId) {
        Rider rider = riderAccessService.findRiderForCompanyScope(riderId);
        List<RiderGuardian> relationships = riderGuardianRepository
                .findAllByTenantIdAndRider_IdAndStatusOrderByPrimaryGuardianDescUpdatedAtDesc(
                        rider.getTenantId(),
                        rider.getId(),
                        RiderGuardianStatus.ACTIVE);
        return toResponse(rider, relationships, true);
    }

    @Transactional
    public RiderResponse createCompanyRider(RiderUpsertRequest request) {
        String tenantId = riderAccessService.requireCompanyTenantId();
        subscriptionEnforcementService.requireRiderCreationAllowed(tenantId);
        Rider rider = new Rider();
        rider.setTenantId(tenantId);
        rider.setRiderCode(riderCodeGenerator.generate(tenantId));
        rider.setStatus(RiderStatus.PENDING);
        riderMapper.apply(rider, request);
        validateBusinessRules(rider);
        Rider saved = riderRepository.save(rider);
        recordAudit(saved, "CREATED", "Rider " + saved.getRiderCode() + " was created.", null, snapshot(saved));
        return toResponse(saved, List.of(), true);
    }

    @Transactional
    public RiderResponse updateCompanyRider(Long riderId, RiderUpsertRequest request) {
        Rider rider = riderAccessService.findRiderForCompanyScope(riderId);
        Object oldSnapshot = snapshot(rider);
        riderMapper.apply(rider, request);
        validateBusinessRules(rider);
        Rider saved = riderRepository.save(rider);
        recordAudit(saved, "UPDATED", "Rider " + saved.getRiderCode() + " was updated.", oldSnapshot,
                snapshot(saved));
        List<RiderGuardian> relationships = riderGuardianRepository
                .findAllByTenantIdAndRider_IdAndStatusOrderByPrimaryGuardianDescUpdatedAtDesc(
                        saved.getTenantId(),
                        saved.getId(),
                        RiderGuardianStatus.ACTIVE);
        return toResponse(saved, relationships, true);
    }

    @Transactional
    public RiderResponse activateCompanyRider(Long riderId) {
        Rider rider = riderAccessService.findRiderForCompanyScope(riderId);
        RiderStatusWorkflow.ensureCanActivate(rider.getStatus());
        return updateStatus(rider, RiderStatus.ACTIVE, "ACTIVATED",
                "Rider " + rider.getRiderCode() + " was activated.");
    }

    @Transactional
    public RiderResponse suspendCompanyRider(Long riderId) {
        Rider rider = riderAccessService.findRiderForCompanyScope(riderId);
        RiderStatusWorkflow.ensureCanSuspend(rider.getStatus());
        return updateStatus(rider, RiderStatus.SUSPENDED, "SUSPENDED",
                "Rider " + rider.getRiderCode() + " was suspended.");
    }

    @Transactional
    public RiderResponse waitlistCompanyRider(Long riderId) {
        Rider rider = riderAccessService.findRiderForCompanyScope(riderId);
        RiderStatusWorkflow.ensureCanWaitlist(rider.getStatus());
        return updateStatus(rider, RiderStatus.WAITLISTED, "WAITLISTED",
                "Rider " + rider.getRiderCode() + " was moved to the waitlist.");
    }

    @Transactional
    public RiderResponse deactivateCompanyRider(Long riderId) {
        Rider rider = riderAccessService.findRiderForCompanyScope(riderId);
        RiderStatusWorkflow.ensureCanDeactivate(rider.getStatus());
        return updateStatus(rider, RiderStatus.INACTIVE, "DEACTIVATED",
                "Rider " + rider.getRiderCode() + " was marked inactive.");
    }

    private RiderResponse updateStatus(Rider rider, RiderStatus status, String action, String summary) {
        Object oldSnapshot = snapshot(rider);
        rider.setStatus(status);
        Rider saved = riderRepository.save(rider);
        recordAudit(saved, action, summary, oldSnapshot, snapshot(saved));
        List<RiderGuardian> relationships = riderGuardianRepository
                .findAllByTenantIdAndRider_IdAndStatusOrderByPrimaryGuardianDescUpdatedAtDesc(
                        saved.getTenantId(),
                        saved.getId(),
                        RiderGuardianStatus.ACTIVE);
        return toResponse(saved, relationships, true);
    }

    private RiderResponse toResponse(Rider rider, List<RiderGuardian> relationships, boolean includeRelationships) {
        RiderGuardianResponse primaryGuardian = relationships.stream()
                .filter(RiderGuardian::isPrimaryGuardian)
                .findFirst()
                .or(() -> relationships.stream().findFirst())
                .map(riderGuardianMapper::toResponse)
                .orElse(null);
        List<RiderGuardianResponse> guardians = includeRelationships
                ? relationships.stream().map(riderGuardianMapper::toResponse).toList()
                : List.of();
        return riderMapper.toResponse(rider, relationships.size(), primaryGuardian, guardians);
    }

    private Map<Long, List<RiderGuardian>> loadActiveRelationshipsByRiderId(String tenantId, Collection<Rider> riders) {
        if (riders.isEmpty()) {
            return Map.of();
        }
        return riderGuardianRepository.findAllByTenantIdAndRider_IdInAndStatusOrderByPrimaryGuardianDescUpdatedAtDesc(
                tenantId,
                riders.stream().map(Rider::getId).toList(),
                RiderGuardianStatus.ACTIVE)
                .stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        relationship -> relationship.getRider().getId(),
                        LinkedHashMap::new,
                        java.util.stream.Collectors.toList()));
    }

    private void validateBusinessRules(Rider rider) {
        LocalDate today = LocalDate.now(clock);
        if (rider.getDateOfBirth() != null && rider.getDateOfBirth().isAfter(today)) {
            throw validationFailure("Date of birth cannot be in the future.");
        }
        if (rider.getDateOfBirth() != null && rider.getDateOfBirth().isBefore(today.minusYears(120))) {
            throw validationFailure("Date of birth must be within a reasonable range.");
        }
        validateTimeWindow(rider.getPreferredPickupWindowStart(), rider.getPreferredPickupWindowEnd(),
                "pickup window");
        validateTimeWindow(rider.getPreferredDropoffWindowStart(), rider.getPreferredDropoffWindowEnd(),
                "dropoff window");
        if (rider.getOrganizationId() != null && rider.getOrganizationId() <= 0) {
            throw validationFailure("Organization reference must be positive when provided.");
        }
        organizationValidationService.validateRiderOrganizationLink(rider.getTenantId(), rider.getOrganizationId());
    }

    private void validateTimeWindow(LocalTime start, LocalTime end, String label) {
        if (start != null && end != null && end.isBefore(start)) {
            throw validationFailure("The " + label + " end time cannot be earlier than the start time.");
        }
    }

    private ApiException validationFailure(String message) {
        return new ApiException(
                ErrorCode.VALIDATION_FAILED,
                HttpStatus.BAD_REQUEST,
                message);
    }

    private void recordAudit(Rider rider, String action, String summary, Object oldValue, Object newValue) {
        auditLogService.record(new AuditLogCommand(
                null,
                rider.getTenantId(),
                "RIDER",
                action,
                "RIDER",
                resolveEntityId(rider),
                summary,
                oldValue,
                newValue));
    }

    private String resolveEntityId(Rider rider) {
        if (rider.getId() != null) {
            return rider.getId().toString();
        }
        return rider.getRiderCode();
    }

    private Object snapshot(Rider rider) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("id", rider.getId());
        values.put("riderCode", rider.getRiderCode());
        values.put("tenantId", rider.getTenantId());
        values.put("riderType", rider.getRiderType() == null ? null : rider.getRiderType().name());
        values.put("firstName", rider.getFirstName());
        values.put("lastName", rider.getLastName());
        values.put("primaryPhone", rider.getPrimaryPhone());
        values.put("wheelchairRequired", rider.isWheelchairRequired());
        values.put("escortRequired", rider.isEscortRequired());
        values.put("organizationId", rider.getOrganizationId());
        values.put("status", rider.getStatus() == null ? null : rider.getStatus().name());
        return values;
    }

    private String resolveSortField(String sortBy) {
        String resolved = sortBy == null ? "updatedAt" : sortBy;
        return switch (resolved) {
            case "createdAt", "updatedAt", "riderCode", "firstName", "lastName", "dateOfBirth", "city",
                    "status" ->
                resolved;
            default -> "updatedAt";
        };
    }
}