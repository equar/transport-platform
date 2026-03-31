package com.transportplatform.tms.features.organization.application;

import com.transportplatform.tms.features.audit.application.AuditLogCommand;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.organization.api.request.OrganizationContactUpsertRequest;
import com.transportplatform.tms.features.organization.api.response.OrganizationContactResponse;
import com.transportplatform.tms.features.organization.domain.Organization;
import com.transportplatform.tms.features.organization.domain.OrganizationContact;
import com.transportplatform.tms.features.organization.domain.OrganizationContactRepository;
import com.transportplatform.tms.features.organization.domain.OrganizationContactStatus;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrganizationContactService {

    private final OrganizationContactRepository organizationContactRepository;
    private final OrganizationAccessService organizationAccessService;
    private final OrganizationContactMapper organizationContactMapper;
    private final AuditLogService auditLogService;

    public OrganizationContactService(OrganizationContactRepository organizationContactRepository,
            OrganizationAccessService organizationAccessService,
            OrganizationContactMapper organizationContactMapper,
            AuditLogService auditLogService) {
        this.organizationContactRepository = organizationContactRepository;
        this.organizationAccessService = organizationAccessService;
        this.organizationContactMapper = organizationContactMapper;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public List<OrganizationContactResponse> listOrganizationContacts(Long organizationId) {
        Organization organization = organizationAccessService.findOrganizationForCompanyScope(organizationId);
        return organizationContactRepository.findAllByTenantIdAndOrganization_IdOrderByPrimaryDescUpdatedAtDesc(
                organization.getTenantId(),
                organization.getId())
                .stream()
                .map(organizationContactMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public OrganizationContactResponse getOrganizationContact(Long contactId) {
        return organizationContactMapper
                .toResponse(organizationAccessService.findOrganizationContactForCompanyScope(contactId));
    }

    @Transactional
    public OrganizationContactResponse createOrganizationContact(Long organizationId,
            OrganizationContactUpsertRequest request) {
        Organization organization = organizationAccessService.findOrganizationForCompanyScope(organizationId);
        OrganizationContact contact = new OrganizationContact();
        contact.setTenantId(organization.getTenantId());
        contact.setOrganization(organization);
        contact.setStatus(OrganizationContactStatus.ACTIVE);
        organizationContactMapper.apply(contact, request);
        contact.setPrimary(
                resolvePrimarySelection(organization.getTenantId(), organization.getId(), null, request.primary()));
        OrganizationContact saved = organizationContactRepository.save(contact);
        recordAudit(saved, "CREATED", "Organization contact was created.", null, snapshot(saved));
        return organizationContactMapper.toResponse(saved);
    }

    @Transactional
    public OrganizationContactResponse updateOrganizationContact(Long contactId,
            OrganizationContactUpsertRequest request) {
        OrganizationContact contact = organizationAccessService.findOrganizationContactForCompanyScope(contactId);
        Object oldSnapshot = snapshot(contact);
        organizationContactMapper.apply(contact, request);
        contact.setPrimary(resolvePrimarySelection(
                contact.getTenantId(),
                contact.getOrganization().getId(),
                contact.getId(),
                request.primary()));
        OrganizationContact saved = organizationContactRepository.save(contact);
        recordAudit(saved, "UPDATED", "Organization contact was updated.", oldSnapshot, snapshot(saved));
        return organizationContactMapper.toResponse(saved);
    }

    @Transactional
    public OrganizationContactResponse activateOrganizationContact(Long contactId) {
        OrganizationContact contact = organizationAccessService.findOrganizationContactForCompanyScope(contactId);
        OrganizationContactStatusWorkflow.ensureCanActivate(contact.getStatus());
        Object oldSnapshot = snapshot(contact);
        contact.setStatus(OrganizationContactStatus.ACTIVE);
        contact.setPrimary(resolvePrimarySelection(contact.getTenantId(), contact.getOrganization().getId(),
                contact.getId(), contact.isPrimary()));
        OrganizationContact saved = organizationContactRepository.save(contact);
        recordAudit(saved, "ACTIVATED", "Organization contact was activated.", oldSnapshot, snapshot(saved));
        return organizationContactMapper.toResponse(saved);
    }

    @Transactional
    public OrganizationContactResponse deactivateOrganizationContact(Long contactId) {
        OrganizationContact contact = organizationAccessService.findOrganizationContactForCompanyScope(contactId);
        OrganizationContactStatusWorkflow.ensureCanDeactivate(contact.getStatus());
        Object oldSnapshot = snapshot(contact);
        boolean wasPrimary = contact.isPrimary();
        contact.setStatus(OrganizationContactStatus.INACTIVE);
        contact.setPrimary(false);
        OrganizationContact saved = organizationContactRepository.save(contact);
        if (wasPrimary) {
            promoteFallbackPrimary(saved.getTenantId(), saved.getOrganization().getId(), saved.getId());
        }
        recordAudit(saved, "DEACTIVATED", "Organization contact was deactivated.", oldSnapshot, snapshot(saved));
        return organizationContactMapper.toResponse(saved);
    }

    @Transactional
    public OrganizationContactResponse setPrimaryOrganizationContact(Long contactId) {
        OrganizationContact contact = organizationAccessService.findOrganizationContactForCompanyScope(contactId);
        Object oldSnapshot = snapshot(contact);
        contact.setPrimary(resolvePrimarySelection(contact.getTenantId(), contact.getOrganization().getId(),
                contact.getId(), true));
        OrganizationContact saved = organizationContactRepository.save(contact);
        recordAudit(saved, "PRIMARY_ASSIGNED", "Organization primary contact was updated.", oldSnapshot,
                snapshot(saved));
        return organizationContactMapper.toResponse(saved);
    }

    private boolean resolvePrimarySelection(String tenantId, Long organizationId, Long contactId,
            boolean requestedPrimary) {
        List<OrganizationContact> contacts = organizationContactRepository
                .findAllByTenantIdAndOrganization_IdOrderByPrimaryDescUpdatedAtDesc(tenantId, organizationId);
        List<OrganizationContact> activeContacts = contacts.stream()
                .filter(contact -> contact.getStatus() == OrganizationContactStatus.ACTIVE)
                .toList();
        boolean noOtherActiveContacts = activeContacts.stream()
                .noneMatch(contact -> contactId == null || !contact.getId().equals(contactId));
        boolean selectedPrimary = requestedPrimary || noOtherActiveContacts;
        if (selectedPrimary) {
            for (OrganizationContact activeContact : activeContacts) {
                if (contactId == null || !activeContact.getId().equals(contactId)) {
                    activeContact.setPrimary(false);
                }
            }
            organizationContactRepository.saveAll(activeContacts);
        }
        return selectedPrimary;
    }

    private void promoteFallbackPrimary(String tenantId, Long organizationId, Long excludedContactId) {
        List<OrganizationContact> contacts = organizationContactRepository
                .findAllByTenantIdAndOrganization_IdOrderByPrimaryDescUpdatedAtDesc(tenantId, organizationId);
        boolean hasPrimary = contacts.stream()
                .filter(contact -> contact.getStatus() == OrganizationContactStatus.ACTIVE)
                .anyMatch(OrganizationContact::isPrimary);
        if (hasPrimary) {
            return;
        }
        contacts.stream()
                .filter(contact -> contact.getStatus() == OrganizationContactStatus.ACTIVE)
                .filter(contact -> excludedContactId == null || !contact.getId().equals(excludedContactId))
                .findFirst()
                .ifPresent(contact -> {
                    contact.setPrimary(true);
                    organizationContactRepository.save(contact);
                });
    }

    private void recordAudit(OrganizationContact contact, String action, String summary, Object oldValue,
            Object newValue) {
        auditLogService.record(new AuditLogCommand(
                null,
                contact.getTenantId(),
                "ORGANIZATION_CONTACT",
                action,
                "ORGANIZATION_CONTACT",
                resolveEntityId(contact),
                summary,
                oldValue,
                newValue));
    }

    private String resolveEntityId(OrganizationContact contact) {
        if (contact.getId() != null) {
            return contact.getId().toString();
        }
        return contact.getOrganization().getId() + ":" + contact.getFirstName() + ":" + contact.getLastName();
    }

    private Object snapshot(OrganizationContact contact) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("id", contact.getId());
        values.put("organizationId", contact.getOrganization().getId());
        values.put("firstName", contact.getFirstName());
        values.put("lastName", contact.getLastName());
        values.put("email", contact.getEmail());
        values.put("phone", contact.getPhone());
        values.put("primary", contact.isPrimary());
        values.put("status", contact.getStatus() == null ? null : contact.getStatus().name());
        return values;
    }
}