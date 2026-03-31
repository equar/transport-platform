package com.transportplatform.tms.features.tenant.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.audit.application.AuditLogCommand;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.tenant.api.request.TenantUpsertRequest;
import com.transportplatform.tms.features.tenant.api.response.TenantResponse;
import com.transportplatform.tms.features.tenant.domain.Tenant;
import com.transportplatform.tms.features.tenant.domain.TenantRepository;
import com.transportplatform.tms.features.tenant.domain.TenantStatus;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TenantService {

    private final TenantRepository tenantRepository;
    private final TenantMapper tenantMapper;
    private final AuditLogService auditLogService;

    public TenantService(TenantRepository tenantRepository, TenantMapper tenantMapper,
            AuditLogService auditLogService) {
        this.tenantRepository = tenantRepository;
        this.tenantMapper = tenantMapper;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public PageResponse<TenantResponse> search(String keyword, TenantStatus status, int page, int size) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        var result = tenantRepository.findAll(TenantSpecifications.search(keyword, status), pageable)
                .map(tenantMapper::toResponse);
        return PageResponse.from(result);
    }

    @Transactional(readOnly = true)
    public TenantResponse getById(String tenantId) {
        return tenantMapper.toResponse(findTenant(tenantId));
    }

    @Transactional
    public TenantResponse create(TenantUpsertRequest request) {
        validateUniqueness(request, null);
        Tenant tenant = new Tenant();
        tenant.setId(UUID.randomUUID().toString());
        tenant.setStatus(TenantStatus.PENDING);
        tenantMapper.apply(tenant, request);
        Tenant saved = tenantRepository.save(tenant);
        auditLogService.record(new AuditLogCommand(
                null,
                saved.getId(),
                "TENANT",
                "CREATED",
                "TENANT",
                saved.getId(),
                "Tenant " + saved.getCompanyName() + " was created.",
                null,
                snapshot(saved)));
        return tenantMapper.toResponse(saved);
    }

    @Transactional
    public TenantResponse update(String tenantId, TenantUpsertRequest request) {
        Tenant tenant = findTenant(tenantId);
        var oldSnapshot = snapshot(tenant);
        validateUniqueness(request, tenantId);
        tenantMapper.apply(tenant, request);
        Tenant saved = tenantRepository.save(tenant);
        auditLogService.record(new AuditLogCommand(
                null,
                saved.getId(),
                "TENANT",
                "UPDATED",
                "TENANT",
                saved.getId(),
                "Tenant " + saved.getCompanyName() + " was updated.",
                oldSnapshot,
                snapshot(saved)));
        return tenantMapper.toResponse(saved);
    }

    @Transactional
    public TenantResponse activate(String tenantId) {
        Tenant tenant = findTenant(tenantId);
        TenantStatusWorkflow.ensureCanActivate(tenant.getStatus());
        var oldSnapshot = snapshot(tenant);
        tenant.setStatus(TenantStatus.ACTIVE);
        Tenant saved = tenantRepository.save(tenant);
        auditLogService.record(new AuditLogCommand(
                null,
                saved.getId(),
                "TENANT",
                "ACTIVATED",
                "TENANT",
                saved.getId(),
                "Tenant " + saved.getCompanyName() + " was activated.",
                oldSnapshot,
                snapshot(saved)));
        return tenantMapper.toResponse(saved);
    }

    @Transactional
    public TenantResponse suspend(String tenantId) {
        Tenant tenant = findTenant(tenantId);
        TenantStatusWorkflow.ensureCanSuspend(tenant.getStatus());
        var oldSnapshot = snapshot(tenant);
        tenant.setStatus(TenantStatus.SUSPENDED);
        Tenant saved = tenantRepository.save(tenant);
        auditLogService.record(new AuditLogCommand(
                null,
                saved.getId(),
                "TENANT",
                "SUSPENDED",
                "TENANT",
                saved.getId(),
                "Tenant " + saved.getCompanyName() + " was suspended.",
                oldSnapshot,
                snapshot(saved)));
        return tenantMapper.toResponse(saved);
    }

    @Transactional
    public Tenant createFromApplication(Tenant tenant) {
        return tenantRepository.save(tenant);
    }

    private Tenant findTenant(String tenantId) {
        return tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ApiException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        HttpStatus.NOT_FOUND,
                        "Tenant was not found."));
    }

    private void validateUniqueness(TenantUpsertRequest request, String tenantId) {
        boolean tenantCodeExists = tenantId == null
                ? tenantRepository.existsByTenantCodeIgnoreCase(request.tenantCode().trim())
                : tenantRepository.existsByTenantCodeIgnoreCaseAndIdNot(request.tenantCode().trim(), tenantId);
        if (tenantCodeExists) {
            throw new ApiException(
                    ErrorCode.RESOURCE_CONFLICT,
                    HttpStatus.CONFLICT,
                    "Tenant code is already in use.");
        }

        boolean legalNameExists = tenantId == null
                ? tenantRepository.existsByLegalNameIgnoreCase(request.legalName().trim())
                : tenantRepository.existsByLegalNameIgnoreCaseAndIdNot(request.legalName().trim(), tenantId);
        if (legalNameExists) {
            throw new ApiException(
                    ErrorCode.RESOURCE_CONFLICT,
                    HttpStatus.CONFLICT,
                    "Legal name is already in use.");
        }
    }

    private Object snapshot(Tenant tenant) {
        java.util.Map<String, Object> values = new java.util.LinkedHashMap<>();
        values.put("id", tenant.getId());
        values.put("tenantCode", tenant.getTenantCode());
        values.put("companyName", tenant.getCompanyName());
        values.put("status", tenant.getStatus() == null ? null : tenant.getStatus().name());
        values.put("subscriptionPlan", tenant.getSubscriptionPlan());
        return values;
    }
}
