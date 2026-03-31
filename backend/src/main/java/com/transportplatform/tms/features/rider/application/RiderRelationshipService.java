package com.transportplatform.tms.features.rider.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.audit.application.AuditLogCommand;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.rider.api.request.RiderGuardianUpsertRequest;
import com.transportplatform.tms.features.rider.api.response.GuardianLinkedRiderResponse;
import com.transportplatform.tms.features.rider.api.response.RiderGuardianResponse;
import com.transportplatform.tms.features.rider.domain.Guardian;
import com.transportplatform.tms.features.rider.domain.Rider;
import com.transportplatform.tms.features.rider.domain.RiderGuardian;
import com.transportplatform.tms.features.rider.domain.RiderGuardianRepository;
import com.transportplatform.tms.features.rider.domain.RiderGuardianStatus;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RiderRelationshipService {

    private final RiderGuardianRepository riderGuardianRepository;
    private final RiderAccessService riderAccessService;
    private final GuardianAccessService guardianAccessService;
    private final RiderGuardianMapper riderGuardianMapper;
    private final AuditLogService auditLogService;

    public RiderRelationshipService(RiderGuardianRepository riderGuardianRepository,
            RiderAccessService riderAccessService,
            GuardianAccessService guardianAccessService,
            RiderGuardianMapper riderGuardianMapper,
            AuditLogService auditLogService) {
        this.riderGuardianRepository = riderGuardianRepository;
        this.riderAccessService = riderAccessService;
        this.guardianAccessService = guardianAccessService;
        this.riderGuardianMapper = riderGuardianMapper;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public List<RiderGuardianResponse> listGuardiansForRider(Long riderId) {
        Rider rider = riderAccessService.findRiderForCompanyScope(riderId);
        return riderGuardianRepository.findAllByTenantIdAndRider_IdAndStatusOrderByPrimaryGuardianDescUpdatedAtDesc(
                rider.getTenantId(),
                rider.getId(),
                RiderGuardianStatus.ACTIVE)
                .stream()
                .map(riderGuardianMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<GuardianLinkedRiderResponse> listRidersForGuardian(Long guardianId) {
        Guardian guardian = guardianAccessService.findGuardianForCompanyScope(guardianId);
        return riderGuardianRepository.findAllByTenantIdAndGuardian_IdAndStatusOrderByPrimaryGuardianDescUpdatedAtDesc(
                guardian.getTenantId(),
                guardian.getId(),
                RiderGuardianStatus.ACTIVE)
                .stream()
                .map(riderGuardianMapper::toGuardianLinkedRiderResponse)
                .toList();
    }

    @Transactional
    public RiderGuardianResponse linkGuardianToRider(Long riderId, RiderGuardianUpsertRequest request) {
        Rider rider = riderAccessService.findRiderForCompanyScope(riderId);
        Guardian guardian = guardianAccessService.findGuardianForCompanyScope(request.guardianId());
        validateSameTenant(rider, guardian);

        return riderGuardianRepository.findByTenantIdAndRider_IdAndGuardian_Id(
                rider.getTenantId(),
                rider.getId(),
                guardian.getId())
                .map(existing -> reactivateOrReject(existing, request))
                .orElseGet(() -> createRelationship(rider, guardian, request));
    }

    @Transactional
    public RiderGuardianResponse updateRiderGuardian(Long relationshipId, RiderGuardianUpsertRequest request) {
        RiderGuardian relationship = findRelationship(relationshipId);
        if (!relationship.getGuardian().getId().equals(request.guardianId())) {
            throw new ApiException(
                    ErrorCode.RESOURCE_CONFLICT,
                    HttpStatus.CONFLICT,
                    "Relationship guardian cannot be reassigned. Unlink the record and create a new link instead.");
        }

        Object oldSnapshot = snapshot(relationship);
        riderGuardianMapper.applyAttributes(relationship, request);
        relationship.setPrimaryGuardian(resolvePrimarySelection(
                relationship.getTenantId(),
                relationship.getRider().getId(),
                relationship.getId(),
                request.primaryGuardian()));
        RiderGuardian saved = riderGuardianRepository.save(relationship);
        recordAudit(saved, "UPDATED", "Rider guardian relationship was updated.", oldSnapshot, snapshot(saved));
        return riderGuardianMapper.toResponse(saved);
    }

    @Transactional
    public RiderGuardianResponse unlinkRiderGuardian(Long relationshipId) {
        RiderGuardian relationship = findRelationship(relationshipId);
        if (relationship.getStatus() == RiderGuardianStatus.INACTIVE) {
            throw new ApiException(
                    ErrorCode.INVALID_STATUS_TRANSITION,
                    HttpStatus.BAD_REQUEST,
                    "Guardian relationship is already inactive.");
        }

        Object oldSnapshot = snapshot(relationship);
        boolean wasPrimary = relationship.isPrimaryGuardian();
        relationship.setStatus(RiderGuardianStatus.INACTIVE);
        relationship.setPrimaryGuardian(false);
        RiderGuardian saved = riderGuardianRepository.save(relationship);
        if (wasPrimary) {
            promoteFallbackPrimary(saved.getTenantId(), saved.getRider().getId(), saved.getId());
        }
        recordAudit(saved, "UNLINKED", "Guardian was unlinked from rider.", oldSnapshot, snapshot(saved));
        return riderGuardianMapper.toResponse(saved);
    }

    private RiderGuardianResponse reactivateOrReject(RiderGuardian existing, RiderGuardianUpsertRequest request) {
        if (existing.getStatus() == RiderGuardianStatus.ACTIVE) {
            throw new ApiException(
                    ErrorCode.RESOURCE_CONFLICT,
                    HttpStatus.CONFLICT,
                    "This guardian is already linked to the selected rider.");
        }
        Object oldSnapshot = snapshot(existing);
        riderGuardianMapper.applyAttributes(existing, request);
        existing.setStatus(RiderGuardianStatus.ACTIVE);
        existing.setPrimaryGuardian(resolvePrimarySelection(
                existing.getTenantId(),
                existing.getRider().getId(),
                existing.getId(),
                request.primaryGuardian()));
        RiderGuardian saved = riderGuardianRepository.save(existing);
        recordAudit(saved, "LINKED", "Guardian was linked to rider.", oldSnapshot, snapshot(saved));
        return riderGuardianMapper.toResponse(saved);
    }

    private RiderGuardianResponse createRelationship(Rider rider, Guardian guardian,
            RiderGuardianUpsertRequest request) {
        RiderGuardian relationship = new RiderGuardian();
        relationship.setTenantId(rider.getTenantId());
        relationship.setRider(rider);
        relationship.setGuardian(guardian);
        relationship.setStatus(RiderGuardianStatus.ACTIVE);
        riderGuardianMapper.applyAttributes(relationship, request);
        relationship.setPrimaryGuardian(resolvePrimarySelection(rider.getTenantId(), rider.getId(), null,
                request.primaryGuardian()));
        RiderGuardian saved = riderGuardianRepository.save(relationship);
        recordAudit(saved, "LINKED", "Guardian was linked to rider.", null, snapshot(saved));
        return riderGuardianMapper.toResponse(saved);
    }

    private RiderGuardian findRelationship(Long relationshipId) {
        String tenantId = riderAccessService.requireCompanyTenantId();
        return riderGuardianRepository.findByIdAndTenantId(relationshipId, tenantId)
                .orElseThrow(() -> new ApiException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        HttpStatus.NOT_FOUND,
                        "Rider guardian relationship was not found."));
    }

    private void validateSameTenant(Rider rider, Guardian guardian) {
        if (!rider.getTenantId().equals(guardian.getTenantId())) {
            throw new ApiException(
                    ErrorCode.FORBIDDEN,
                    HttpStatus.FORBIDDEN,
                    "Riders and guardians must belong to the same tenant.");
        }
    }

    private boolean resolvePrimarySelection(String tenantId, Long riderId, Long relationshipId,
            boolean requestedPrimary) {
        List<RiderGuardian> activeRelationships = riderGuardianRepository
                .findAllByTenantIdAndRider_IdAndStatusOrderByPrimaryGuardianDescUpdatedAtDesc(
                        tenantId,
                        riderId,
                        RiderGuardianStatus.ACTIVE);
        boolean noOtherActiveRelationships = activeRelationships.stream()
                .noneMatch(relationship -> relationshipId == null || !relationship.getId().equals(relationshipId));
        boolean selectedPrimary = requestedPrimary || noOtherActiveRelationships;
        if (selectedPrimary) {
            for (RiderGuardian activeRelationship : activeRelationships) {
                if (relationshipId == null || !activeRelationship.getId().equals(relationshipId)) {
                    activeRelationship.setPrimaryGuardian(false);
                }
            }
            riderGuardianRepository.saveAll(activeRelationships);
        }
        return selectedPrimary;
    }

    private void promoteFallbackPrimary(String tenantId, Long riderId, Long excludedRelationshipId) {
        List<RiderGuardian> activeRelationships = riderGuardianRepository
                .findAllByTenantIdAndRider_IdAndStatusOrderByPrimaryGuardianDescUpdatedAtDesc(
                        tenantId,
                        riderId,
                        RiderGuardianStatus.ACTIVE);
        if (activeRelationships.isEmpty() || activeRelationships.stream().anyMatch(RiderGuardian::isPrimaryGuardian)) {
            return;
        }
        RiderGuardian fallback = activeRelationships.stream()
                .filter(relationship -> excludedRelationshipId == null
                        || !relationship.getId().equals(excludedRelationshipId))
                .findFirst()
                .orElse(null);
        if (fallback != null) {
            fallback.setPrimaryGuardian(true);
            riderGuardianRepository.save(fallback);
        }
    }

    private void recordAudit(RiderGuardian relationship, String action, String summary, Object oldValue,
            Object newValue) {
        auditLogService.record(new AuditLogCommand(
                null,
                relationship.getTenantId(),
                "RIDER_GUARDIAN",
                action,
                "RIDER_GUARDIAN",
                resolveEntityId(relationship),
                summary,
                oldValue,
                newValue));
    }

    private String resolveEntityId(RiderGuardian relationship) {
        if (relationship.getId() != null) {
            return relationship.getId().toString();
        }
        return relationship.getRider().getId() + ":" + relationship.getGuardian().getId();
    }

    private Object snapshot(RiderGuardian relationship) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("id", relationship.getId());
        values.put("riderId", relationship.getRider().getId());
        values.put("guardianId", relationship.getGuardian().getId());
        values.put("relationshipType",
                relationship.getRelationshipType() == null ? null : relationship.getRelationshipType().name());
        values.put("primaryGuardian", relationship.isPrimaryGuardian());
        values.put("authorizedForPickup", relationship.isAuthorizedForPickup());
        values.put("billingContact", relationship.isBillingContact());
        values.put("status", relationship.getStatus() == null ? null : relationship.getStatus().name());
        values.put("notes", relationship.getNotes());
        return values;
    }
}