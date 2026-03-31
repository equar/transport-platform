package com.transportplatform.tms.features.organization.application;

import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.audit.application.AuditLogCommand;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.organization.api.request.OrganizationUpsertRequest;
import com.transportplatform.tms.features.organization.api.response.OrganizationContactResponse;
import com.transportplatform.tms.features.organization.api.response.OrganizationContractSummaryResponse;
import com.transportplatform.tms.features.organization.api.response.OrganizationLinkedRiderResponse;
import com.transportplatform.tms.features.organization.api.response.OrganizationResponse;
import com.transportplatform.tms.features.organization.domain.Contract;
import com.transportplatform.tms.features.organization.domain.ContractRepository;
import com.transportplatform.tms.features.organization.domain.ContractStatus;
import com.transportplatform.tms.features.organization.domain.Organization;
import com.transportplatform.tms.features.organization.domain.OrganizationContact;
import com.transportplatform.tms.features.organization.domain.OrganizationContactRepository;
import com.transportplatform.tms.features.organization.domain.OrganizationRepository;
import com.transportplatform.tms.features.organization.domain.OrganizationStatus;
import com.transportplatform.tms.features.organization.domain.OrganizationType;
import com.transportplatform.tms.features.rider.domain.Rider;
import com.transportplatform.tms.features.rider.domain.RiderRepository;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final OrganizationContactRepository organizationContactRepository;
    private final ContractRepository contractRepository;
    private final RiderRepository riderRepository;
    private final OrganizationMapper organizationMapper;
    private final OrganizationContactMapper organizationContactMapper;
    private final ContractMapper contractMapper;
    private final OrganizationAccessService organizationAccessService;
    private final OrganizationCodeGenerator organizationCodeGenerator;
    private final AuditLogService auditLogService;

    public OrganizationService(OrganizationRepository organizationRepository,
            OrganizationContactRepository organizationContactRepository,
            ContractRepository contractRepository,
            RiderRepository riderRepository,
            OrganizationMapper organizationMapper,
            OrganizationContactMapper organizationContactMapper,
            ContractMapper contractMapper,
            OrganizationAccessService organizationAccessService,
            OrganizationCodeGenerator organizationCodeGenerator,
            AuditLogService auditLogService) {
        this.organizationRepository = organizationRepository;
        this.organizationContactRepository = organizationContactRepository;
        this.contractRepository = contractRepository;
        this.riderRepository = riderRepository;
        this.organizationMapper = organizationMapper;
        this.organizationContactMapper = organizationContactMapper;
        this.contractMapper = contractMapper;
        this.organizationAccessService = organizationAccessService;
        this.organizationCodeGenerator = organizationCodeGenerator;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public PageResponse<OrganizationResponse> searchCompanyOrganizations(String keyword,
            OrganizationStatus status,
            OrganizationType organizationType,
            int page,
            int size,
            String sortBy,
            Sort.Direction sortDirection) {
        String tenantId = organizationAccessService.requireCompanyTenantId();
        var pageable = PageRequest.of(page, size, Sort.by(sortDirection, resolveSortField(sortBy)));
        var result = organizationRepository.findAll(
                OrganizationSpecifications.search(tenantId, keyword, status, organizationType),
                pageable);
        Map<Long, List<OrganizationContact>> contactsByOrganizationId = loadContactsByOrganizationId(tenantId,
                result.getContent());
        Map<Long, List<Contract>> contractsByOrganizationId = loadContractsByOrganizationId(tenantId,
                result.getContent());
        return PageResponse.from(result.map(organization -> toResponse(
                organization,
                contactsByOrganizationId.getOrDefault(organization.getId(), List.of()),
                contractsByOrganizationId.getOrDefault(organization.getId(), List.of()),
                List.of(),
                false)));
    }

    @Transactional(readOnly = true)
    public OrganizationResponse getCompanyOrganization(Long organizationId) {
        Organization organization = organizationAccessService.findOrganizationForCompanyScope(organizationId);
        List<OrganizationContact> contacts = organizationContactRepository
                .findAllByTenantIdAndOrganization_IdOrderByPrimaryDescUpdatedAtDesc(
                        organization.getTenantId(),
                        organization.getId());
        List<Contract> contracts = contractRepository.findTop10ByTenantIdAndOrganization_IdOrderByUpdatedAtDesc(
                organization.getTenantId(),
                organization.getId());
        List<Rider> linkedRiders = riderRepository.findTop10ByTenantIdAndOrganizationIdOrderByLastNameAscFirstNameAsc(
                organization.getTenantId(),
                organization.getId());
        return toResponse(organization, contacts, contracts, linkedRiders, true);
    }

    @Transactional(readOnly = true)
    public List<OrganizationResponse> listActiveOrganizations() {
        String tenantId = organizationAccessService.requireCompanyTenantId();
        return organizationRepository.findAllByTenantIdAndStatusOrderByNameAsc(tenantId, OrganizationStatus.ACTIVE)
                .stream()
                .map(organization -> toResponse(organization, List.of(), List.of(), List.of(), false))
                .toList();
    }

    @Transactional
    public OrganizationResponse createCompanyOrganization(OrganizationUpsertRequest request) {
        String tenantId = organizationAccessService.requireCompanyTenantId();
        Organization organization = new Organization();
        organization.setTenantId(tenantId);
        organization.setOrganizationCode(organizationCodeGenerator.generate(tenantId));
        organization.setStatus(OrganizationStatus.PENDING);
        organizationMapper.apply(organization, request);
        Organization saved = organizationRepository.save(organization);
        recordAudit(saved, "CREATED", "Organization " + saved.getOrganizationCode() + " was created.", null,
                snapshot(saved));
        return toResponse(saved, List.of(), List.of(), List.of(), true);
    }

    @Transactional
    public OrganizationResponse updateCompanyOrganization(Long organizationId, OrganizationUpsertRequest request) {
        Organization organization = organizationAccessService.findOrganizationForCompanyScope(organizationId);
        Object oldSnapshot = snapshot(organization);
        organizationMapper.apply(organization, request);
        Organization saved = organizationRepository.save(organization);
        recordAudit(saved, "UPDATED", "Organization " + saved.getOrganizationCode() + " was updated.", oldSnapshot,
                snapshot(saved));
        List<OrganizationContact> contacts = organizationContactRepository
                .findAllByTenantIdAndOrganization_IdOrderByPrimaryDescUpdatedAtDesc(saved.getTenantId(), saved.getId());
        List<Contract> contracts = contractRepository.findTop10ByTenantIdAndOrganization_IdOrderByUpdatedAtDesc(
                saved.getTenantId(),
                saved.getId());
        List<Rider> riders = riderRepository.findTop10ByTenantIdAndOrganizationIdOrderByLastNameAscFirstNameAsc(
                saved.getTenantId(),
                saved.getId());
        return toResponse(saved, contacts, contracts, riders, true);
    }

    @Transactional
    public OrganizationResponse activateCompanyOrganization(Long organizationId) {
        Organization organization = organizationAccessService.findOrganizationForCompanyScope(organizationId);
        OrganizationStatusWorkflow.ensureCanActivate(organization.getStatus());
        return updateStatus(organization, OrganizationStatus.ACTIVE, "ACTIVATED",
                "Organization " + organization.getOrganizationCode() + " was activated.");
    }

    @Transactional
    public OrganizationResponse suspendCompanyOrganization(Long organizationId) {
        Organization organization = organizationAccessService.findOrganizationForCompanyScope(organizationId);
        OrganizationStatusWorkflow.ensureCanSuspend(organization.getStatus());
        return updateStatus(organization, OrganizationStatus.SUSPENDED, "SUSPENDED",
                "Organization " + organization.getOrganizationCode() + " was suspended.");
    }

    @Transactional
    public OrganizationResponse deactivateCompanyOrganization(Long organizationId) {
        Organization organization = organizationAccessService.findOrganizationForCompanyScope(organizationId);
        OrganizationStatusWorkflow.ensureCanDeactivate(organization.getStatus());
        return updateStatus(organization, OrganizationStatus.INACTIVE, "DEACTIVATED",
                "Organization " + organization.getOrganizationCode() + " was marked inactive.");
    }

    private OrganizationResponse updateStatus(Organization organization, OrganizationStatus status, String action,
            String summary) {
        Object oldSnapshot = snapshot(organization);
        organization.setStatus(status);
        Organization saved = organizationRepository.save(organization);
        recordAudit(saved, action, summary, oldSnapshot, snapshot(saved));
        List<OrganizationContact> contacts = organizationContactRepository
                .findAllByTenantIdAndOrganization_IdOrderByPrimaryDescUpdatedAtDesc(saved.getTenantId(), saved.getId());
        List<Contract> contracts = contractRepository.findTop10ByTenantIdAndOrganization_IdOrderByUpdatedAtDesc(
                saved.getTenantId(),
                saved.getId());
        List<Rider> riders = riderRepository.findTop10ByTenantIdAndOrganizationIdOrderByLastNameAscFirstNameAsc(
                saved.getTenantId(),
                saved.getId());
        return toResponse(saved, contacts, contracts, riders, true);
    }

    private OrganizationResponse toResponse(Organization organization,
            List<OrganizationContact> contacts,
            List<Contract> contracts,
            List<Rider> linkedRiders,
            boolean includeDetailCollections) {
        List<OrganizationContactResponse> contactResponses = includeDetailCollections
                ? contacts.stream().map(organizationContactMapper::toResponse).toList()
                : List.of();
        OrganizationContactResponse primaryContact = contacts.stream()
                .filter(contact -> contact
                        .getStatus() == com.transportplatform.tms.features.organization.domain.OrganizationContactStatus.ACTIVE)
                .filter(OrganizationContact::isPrimary)
                .findFirst()
                .or(() -> contacts.stream()
                        .filter(contact -> contact
                                .getStatus() == com.transportplatform.tms.features.organization.domain.OrganizationContactStatus.ACTIVE)
                        .findFirst())
                .map(organizationContactMapper::toResponse)
                .orElse(null);
        List<OrganizationContractSummaryResponse> contractResponses = includeDetailCollections
                ? contracts.stream()
                        .map(contract -> contractMapper.toSummaryResponse(contract,
                                ContractStatusWorkflow.resolveEffectiveStatus(contract, java.time.LocalDate.now())))
                        .toList()
                : List.of();
        List<OrganizationLinkedRiderResponse> riderResponses = includeDetailCollections
                ? linkedRiders.stream()
                        .map(rider -> new OrganizationLinkedRiderResponse(
                                rider.getId(),
                                rider.getRiderCode(),
                                (rider.getFirstName() + " " + rider.getLastName()).trim(),
                                rider.getRiderType(),
                                rider.getStatus(),
                                rider.isWheelchairRequired(),
                                rider.isEscortRequired()))
                        .toList()
                : List.of();
        long activeContractCount = contracts.stream()
                .filter(contract -> ContractStatusWorkflow.resolveEffectiveStatus(contract,
                        java.time.LocalDate.now()) == ContractStatus.ACTIVE)
                .count();
        long linkedRiderCount = organization.getId() == null ? 0
                : riderRepository.countByTenantIdAndOrganizationId(organization.getTenantId(), organization.getId());
        return organizationMapper.toResponse(
                organization,
                contacts.size(),
                activeContractCount,
                linkedRiderCount,
                primaryContact,
                contactResponses,
                contractResponses,
                riderResponses);
    }

    private Map<Long, List<OrganizationContact>> loadContactsByOrganizationId(String tenantId,
            Collection<Organization> organizations) {
        if (organizations.isEmpty()) {
            return Map.of();
        }
        return organizationContactRepository.findAllByTenantIdAndOrganization_IdInOrderByPrimaryDescUpdatedAtDesc(
                tenantId,
                organizations.stream().map(Organization::getId).toList())
                .stream()
                .collect(Collectors.groupingBy(contact -> contact.getOrganization().getId(), LinkedHashMap::new,
                        Collectors.toList()));
    }

    private Map<Long, List<Contract>> loadContractsByOrganizationId(String tenantId,
            Collection<Organization> organizations) {
        if (organizations.isEmpty()) {
            return Map.of();
        }
        return contractRepository.findAllByTenantIdAndOrganization_IdInOrderByUpdatedAtDesc(
                tenantId,
                organizations.stream().map(Organization::getId).toList())
                .stream()
                .collect(Collectors.groupingBy(contract -> contract.getOrganization().getId(), LinkedHashMap::new,
                        Collectors.toList()));
    }

    private void recordAudit(Organization organization, String action, String summary, Object oldValue,
            Object newValue) {
        auditLogService.record(new AuditLogCommand(
                null,
                organization.getTenantId(),
                "ORGANIZATION",
                action,
                "ORGANIZATION",
                resolveEntityId(organization),
                summary,
                oldValue,
                newValue));
    }

    private String resolveEntityId(Organization organization) {
        if (organization.getId() != null) {
            return organization.getId().toString();
        }
        return organization.getOrganizationCode();
    }

    private Object snapshot(Organization organization) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("id", organization.getId());
        values.put("organizationCode", organization.getOrganizationCode());
        values.put("tenantId", organization.getTenantId());
        values.put("organizationType",
                organization.getOrganizationType() == null ? null : organization.getOrganizationType().name());
        values.put("name", organization.getName());
        values.put("city", organization.getCity());
        values.put("primaryEmail", organization.getPrimaryEmail());
        values.put("primaryPhone", organization.getPrimaryPhone());
        values.put("status", organization.getStatus() == null ? null : organization.getStatus().name());
        return values;
    }

    private String resolveSortField(String sortBy) {
        String resolved = sortBy == null ? "updatedAt" : sortBy;
        return switch (resolved) {
            case "createdAt", "updatedAt", "organizationCode", "name", "legalName", "city", "status" -> resolved;
            default -> "updatedAt";
        };
    }
}