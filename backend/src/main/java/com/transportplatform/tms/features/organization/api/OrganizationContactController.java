package com.transportplatform.tms.features.organization.api;

import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.features.organization.api.request.OrganizationContactUpsertRequest;
import com.transportplatform.tms.features.organization.api.response.OrganizationContactResponse;
import com.transportplatform.tms.features.organization.application.OrganizationContactService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class OrganizationContactController {

    private final OrganizationContactService organizationContactService;

    public OrganizationContactController(OrganizationContactService organizationContactService) {
        this.organizationContactService = organizationContactService;
    }

    @GetMapping("/company/organizations/{organizationId}/contacts")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<List<OrganizationContactResponse>> listOrganizationContacts(@PathVariable Long organizationId) {
        return ApiResponse.success(organizationContactService.listOrganizationContacts(organizationId));
    }

    @GetMapping("/company/organization-contacts/{contactId}")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<OrganizationContactResponse> getOrganizationContact(@PathVariable Long contactId) {
        return ApiResponse.success(organizationContactService.getOrganizationContact(contactId));
    }

    @PostMapping("/company/organizations/{organizationId}/contacts")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<OrganizationContactResponse> createOrganizationContact(@PathVariable Long organizationId,
            @Valid @RequestBody OrganizationContactUpsertRequest request) {
        return ApiResponse.success(organizationContactService.createOrganizationContact(organizationId, request));
    }

    @PutMapping("/company/organization-contacts/{contactId}")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<OrganizationContactResponse> updateOrganizationContact(@PathVariable Long contactId,
            @Valid @RequestBody OrganizationContactUpsertRequest request) {
        return ApiResponse.success(organizationContactService.updateOrganizationContact(contactId, request));
    }

    @PostMapping("/company/organization-contacts/{contactId}/activate")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<OrganizationContactResponse> activateOrganizationContact(@PathVariable Long contactId) {
        return ApiResponse.success(organizationContactService.activateOrganizationContact(contactId));
    }

    @PostMapping("/company/organization-contacts/{contactId}/deactivate")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<OrganizationContactResponse> deactivateOrganizationContact(@PathVariable Long contactId) {
        return ApiResponse.success(organizationContactService.deactivateOrganizationContact(contactId));
    }

    @PostMapping("/company/organization-contacts/{contactId}/primary")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ApiResponse<OrganizationContactResponse> setPrimaryOrganizationContact(@PathVariable Long contactId) {
        return ApiResponse.success(organizationContactService.setPrimaryOrganizationContact(contactId));
    }
}