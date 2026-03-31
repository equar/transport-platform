package com.transportplatform.tms.features.ride.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.organization.domain.Contract;
import com.transportplatform.tms.features.organization.domain.ContractRepository;
import com.transportplatform.tms.features.organization.domain.ContractStatus;
import com.transportplatform.tms.features.organization.domain.Organization;
import com.transportplatform.tms.features.organization.domain.OrganizationRepository;
import com.transportplatform.tms.features.organization.domain.ServiceArea;
import com.transportplatform.tms.features.organization.domain.ServiceAreaRepository;
import com.transportplatform.tms.features.rider.domain.Guardian;
import com.transportplatform.tms.features.rider.domain.GuardianRepository;
import com.transportplatform.tms.features.rider.domain.Rider;
import com.transportplatform.tms.features.rider.domain.RiderGuardianRepository;
import com.transportplatform.tms.features.rider.domain.RiderGuardianStatus;
import com.transportplatform.tms.features.rider.domain.RiderRepository;
import com.transportplatform.tms.features.rider.domain.RiderStatus;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class RideReferenceValidationService {

    private final RiderRepository riderRepository;
    private final GuardianRepository guardianRepository;
    private final RiderGuardianRepository riderGuardianRepository;
    private final OrganizationRepository organizationRepository;
    private final ContractRepository contractRepository;
    private final ServiceAreaRepository serviceAreaRepository;

    public RideReferenceValidationService(RiderRepository riderRepository,
            GuardianRepository guardianRepository,
            RiderGuardianRepository riderGuardianRepository,
            OrganizationRepository organizationRepository,
            ContractRepository contractRepository,
            ServiceAreaRepository serviceAreaRepository) {
        this.riderRepository = riderRepository;
        this.guardianRepository = guardianRepository;
        this.riderGuardianRepository = riderGuardianRepository;
        this.organizationRepository = organizationRepository;
        this.contractRepository = contractRepository;
        this.serviceAreaRepository = serviceAreaRepository;
    }

    public ResolvedReferences resolve(String tenantId,
            Long riderId,
            Long guardianId,
            Long organizationId,
            Long contractId,
            Long serviceAreaId) {
        Rider rider = riderRepository.findByIdAndTenantId(riderId, tenantId)
                .orElseThrow(() -> notFound("Rider was not found."));
        if (rider.getStatus() != RiderStatus.ACTIVE) {
            throw validationFailure("Rides can only be created for active riders.");
        }

        Guardian guardian = null;
        if (guardianId != null) {
            guardian = guardianRepository.findByIdAndTenantId(guardianId, tenantId)
                    .orElseThrow(() -> notFound("Guardian was not found."));
            riderGuardianRepository.findByTenantIdAndRider_IdAndGuardian_Id(tenantId, rider.getId(), guardian.getId())
                    .filter(relationship -> relationship.getStatus() == RiderGuardianStatus.ACTIVE)
                    .orElseThrow(() -> validationFailure(
                            "The selected guardian must be actively linked to the selected rider."));
        }

        Organization organization = null;
        if (organizationId != null) {
            organization = organizationRepository.findByIdAndTenantId(organizationId, tenantId)
                    .orElseThrow(() -> notFound("Organization was not found."));
        } else if (rider.getOrganizationId() != null) {
            organization = organizationRepository.findByIdAndTenantId(rider.getOrganizationId(), tenantId)
                    .orElse(null);
        }

        Contract contract = null;
        if (contractId != null) {
            contract = contractRepository.findByIdAndTenantId(contractId, tenantId)
                    .orElseThrow(() -> notFound("Contract was not found."));
            if (contract.getStatus() == ContractStatus.TERMINATED
                    || contract.getStatus() == ContractStatus.INACTIVE
                    || contract.getStatus() == ContractStatus.EXPIRED) {
                throw validationFailure("Inactive, expired, or terminated contracts cannot be linked to rides.");
            }
            if (organization == null) {
                organization = contract.getOrganization();
            } else if (!contract.getOrganization().getId().equals(organization.getId())) {
                throw validationFailure("The selected contract must belong to the selected organization.");
            }
        }

        if (rider.getOrganizationId() != null
                && organization != null
                && !rider.getOrganizationId().equals(organization.getId())) {
            throw validationFailure("The selected organization must match the rider's linked organization.");
        }

        ServiceArea serviceArea = null;
        if (serviceAreaId != null) {
            serviceArea = serviceAreaRepository.findByIdAndTenantId(serviceAreaId, tenantId)
                    .orElseThrow(() -> notFound("Service area was not found."));
        }

        return new ResolvedReferences(rider, guardian, organization, contract, serviceArea);
    }

    private ApiException notFound(String message) {
        return new ApiException(ErrorCode.RESOURCE_NOT_FOUND, HttpStatus.NOT_FOUND, message);
    }

    private ApiException validationFailure(String message) {
        return new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST, message);
    }

    public record ResolvedReferences(
            Rider rider,
            Guardian guardian,
            Organization organization,
            Contract contract,
            ServiceArea serviceArea) {
    }
}