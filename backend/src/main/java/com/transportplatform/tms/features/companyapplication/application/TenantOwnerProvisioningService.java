package com.transportplatform.tms.features.companyapplication.application;

public interface TenantOwnerProvisioningService {

    Long provisionOwner(String tenantId, String ownerEmail);
}
