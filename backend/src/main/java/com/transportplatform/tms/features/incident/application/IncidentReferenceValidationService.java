package com.transportplatform.tms.features.incident.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.auth.domain.AppUserRepository;
import com.transportplatform.tms.features.driver.domain.DriverRepository;
import com.transportplatform.tms.features.organization.domain.OrganizationRepository;
import com.transportplatform.tms.features.ride.domain.RideRepository;
import com.transportplatform.tms.features.rider.domain.GuardianRepository;
import com.transportplatform.tms.features.rider.domain.RiderRepository;
import com.transportplatform.tms.features.vehicle.domain.VehicleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class IncidentReferenceValidationService {

    private final RideRepository rideRepository;
    private final DriverRepository driverRepository;
    private final VehicleRepository vehicleRepository;
    private final RiderRepository riderRepository;
    private final GuardianRepository guardianRepository;
    private final OrganizationRepository organizationRepository;
    private final AppUserRepository appUserRepository;

    public IncidentReferenceValidationService(RideRepository rideRepository,
            DriverRepository driverRepository,
            VehicleRepository vehicleRepository,
            RiderRepository riderRepository,
            GuardianRepository guardianRepository,
            OrganizationRepository organizationRepository,
            AppUserRepository appUserRepository) {
        this.rideRepository = rideRepository;
        this.driverRepository = driverRepository;
        this.vehicleRepository = vehicleRepository;
        this.riderRepository = riderRepository;
        this.guardianRepository = guardianRepository;
        this.organizationRepository = organizationRepository;
        this.appUserRepository = appUserRepository;
    }

    public void validate(String tenantId,
            Long relatedRideId,
            Long relatedDriverId,
            Long relatedVehicleId,
            Long relatedRiderId,
            Long relatedGuardianId,
            Long relatedOrganizationId,
            Long assignedToUserId) {
        if (relatedRideId != null && rideRepository.findByIdAndTenantId(relatedRideId, tenantId).isEmpty()) {
            throw invalidReference("Related ride was not found.");
        }
        if (relatedDriverId != null && driverRepository.findByIdAndTenantId(relatedDriverId, tenantId).isEmpty()) {
            throw invalidReference("Related driver was not found.");
        }
        if (relatedVehicleId != null && vehicleRepository.findByIdAndTenantId(relatedVehicleId, tenantId).isEmpty()) {
            throw invalidReference("Related vehicle was not found.");
        }
        if (relatedRiderId != null && riderRepository.findByIdAndTenantId(relatedRiderId, tenantId).isEmpty()) {
            throw invalidReference("Related rider was not found.");
        }
        if (relatedGuardianId != null
                && guardianRepository.findByIdAndTenantId(relatedGuardianId, tenantId).isEmpty()) {
            throw invalidReference("Related guardian was not found.");
        }
        if (relatedOrganizationId != null
                && organizationRepository.findByIdAndTenantId(relatedOrganizationId, tenantId).isEmpty()) {
            throw invalidReference("Related organization was not found.");
        }
        if (assignedToUserId != null && appUserRepository.findByIdAndTenantId(assignedToUserId, tenantId).isEmpty()) {
            throw invalidReference("Assigned user was not found.");
        }
    }

    private ApiException invalidReference(String message) {
        return new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST, message);
    }
}