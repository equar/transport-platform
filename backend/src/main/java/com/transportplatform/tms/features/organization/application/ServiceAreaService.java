package com.transportplatform.tms.features.organization.application;

import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.audit.application.AuditLogCommand;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.organization.api.request.ServiceAreaUpsertRequest;
import com.transportplatform.tms.features.organization.api.response.ServiceAreaResponse;
import com.transportplatform.tms.features.organization.domain.ServiceArea;
import com.transportplatform.tms.features.organization.domain.ServiceAreaCoverageType;
import com.transportplatform.tms.features.organization.domain.ServiceAreaRepository;
import com.transportplatform.tms.features.organization.domain.ServiceAreaStatus;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ServiceAreaService {

    private final ServiceAreaRepository serviceAreaRepository;
    private final ServiceAreaMapper serviceAreaMapper;
    private final OrganizationAccessService organizationAccessService;
    private final ServiceAreaCodeGenerator serviceAreaCodeGenerator;
    private final AuditLogService auditLogService;

    public ServiceAreaService(ServiceAreaRepository serviceAreaRepository,
            ServiceAreaMapper serviceAreaMapper,
            OrganizationAccessService organizationAccessService,
            ServiceAreaCodeGenerator serviceAreaCodeGenerator,
            AuditLogService auditLogService) {
        this.serviceAreaRepository = serviceAreaRepository;
        this.serviceAreaMapper = serviceAreaMapper;
        this.organizationAccessService = organizationAccessService;
        this.serviceAreaCodeGenerator = serviceAreaCodeGenerator;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public PageResponse<ServiceAreaResponse> searchCompanyServiceAreas(String keyword,
            ServiceAreaStatus status,
            ServiceAreaCoverageType coverageType,
            int page,
            int size,
            String sortBy,
            Sort.Direction sortDirection) {
        String tenantId = organizationAccessService.requireCompanyTenantId();
        var pageable = PageRequest.of(page, size, Sort.by(sortDirection, resolveSortField(sortBy)));
        var result = serviceAreaRepository.findAll(
                ServiceAreaSpecifications.search(tenantId, keyword, status, coverageType),
                pageable);
        return PageResponse.from(result.map(serviceAreaMapper::toResponse));
    }

    @Transactional(readOnly = true)
    public ServiceAreaResponse getCompanyServiceArea(Long serviceAreaId) {
        return serviceAreaMapper.toResponse(organizationAccessService.findServiceAreaForCompanyScope(serviceAreaId));
    }

    @Transactional
    public ServiceAreaResponse createCompanyServiceArea(ServiceAreaUpsertRequest request) {
        String tenantId = organizationAccessService.requireCompanyTenantId();
        ServiceArea serviceArea = new ServiceArea();
        serviceArea.setTenantId(tenantId);
        serviceArea.setAreaCode(serviceAreaCodeGenerator.generate(tenantId));
        serviceArea.setStatus(ServiceAreaStatus.ACTIVE);
        serviceAreaMapper.apply(serviceArea, request);
        ServiceArea saved = serviceAreaRepository.save(serviceArea);
        recordAudit(saved, "CREATED", "Service area " + saved.getAreaCode() + " was created.", null, snapshot(saved));
        return serviceAreaMapper.toResponse(saved);
    }

    @Transactional
    public ServiceAreaResponse updateCompanyServiceArea(Long serviceAreaId, ServiceAreaUpsertRequest request) {
        ServiceArea serviceArea = organizationAccessService.findServiceAreaForCompanyScope(serviceAreaId);
        Object oldSnapshot = snapshot(serviceArea);
        serviceAreaMapper.apply(serviceArea, request);
        ServiceArea saved = serviceAreaRepository.save(serviceArea);
        recordAudit(saved, "UPDATED", "Service area " + saved.getAreaCode() + " was updated.", oldSnapshot,
                snapshot(saved));
        return serviceAreaMapper.toResponse(saved);
    }

    @Transactional
    public ServiceAreaResponse activateCompanyServiceArea(Long serviceAreaId) {
        ServiceArea serviceArea = organizationAccessService.findServiceAreaForCompanyScope(serviceAreaId);
        ServiceAreaStatusWorkflow.ensureCanActivate(serviceArea.getStatus());
        return updateStatus(serviceArea, ServiceAreaStatus.ACTIVE, "ACTIVATED",
                "Service area " + serviceArea.getAreaCode() + " was activated.");
    }

    @Transactional
    public ServiceAreaResponse deactivateCompanyServiceArea(Long serviceAreaId) {
        ServiceArea serviceArea = organizationAccessService.findServiceAreaForCompanyScope(serviceAreaId);
        ServiceAreaStatusWorkflow.ensureCanDeactivate(serviceArea.getStatus());
        return updateStatus(serviceArea, ServiceAreaStatus.INACTIVE, "DEACTIVATED",
                "Service area " + serviceArea.getAreaCode() + " was marked inactive.");
    }

    private ServiceAreaResponse updateStatus(ServiceArea serviceArea, ServiceAreaStatus status, String action,
            String summary) {
        Object oldSnapshot = snapshot(serviceArea);
        serviceArea.setStatus(status);
        ServiceArea saved = serviceAreaRepository.save(serviceArea);
        recordAudit(saved, action, summary, oldSnapshot, snapshot(saved));
        return serviceAreaMapper.toResponse(saved);
    }

    private void recordAudit(ServiceArea serviceArea, String action, String summary, Object oldValue, Object newValue) {
        auditLogService.record(new AuditLogCommand(
                null,
                serviceArea.getTenantId(),
                "SERVICE_AREA",
                action,
                "SERVICE_AREA",
                resolveEntityId(serviceArea),
                summary,
                oldValue,
                newValue));
    }

    private String resolveEntityId(ServiceArea serviceArea) {
        if (serviceArea.getId() != null) {
            return serviceArea.getId().toString();
        }
        return serviceArea.getAreaCode();
    }

    private Object snapshot(ServiceArea serviceArea) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("id", serviceArea.getId());
        values.put("areaCode", serviceArea.getAreaCode());
        values.put("name", serviceArea.getName());
        values.put("coverageType", serviceArea.getCoverageType() == null ? null : serviceArea.getCoverageType().name());
        values.put("city", serviceArea.getCity());
        values.put("state", serviceArea.getState());
        values.put("zipCode", serviceArea.getZipCode());
        values.put("county", serviceArea.getCounty());
        values.put("status", serviceArea.getStatus() == null ? null : serviceArea.getStatus().name());
        return values;
    }

    private String resolveSortField(String sortBy) {
        String resolved = sortBy == null ? "updatedAt" : sortBy;
        return switch (resolved) {
            case "createdAt", "updatedAt", "areaCode", "name", "city", "state", "zipCode", "status" -> resolved;
            default -> "updatedAt";
        };
    }
}