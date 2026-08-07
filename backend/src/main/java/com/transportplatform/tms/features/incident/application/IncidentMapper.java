package com.transportplatform.tms.features.incident.application;

import com.transportplatform.tms.features.auth.domain.AppUser;
import com.transportplatform.tms.features.auth.domain.AppUserRepository;
import com.transportplatform.tms.features.driver.domain.Driver;
import com.transportplatform.tms.features.driver.domain.DriverRepository;
import com.transportplatform.tms.features.incident.api.request.IncidentUpsertRequest;
import com.transportplatform.tms.features.incident.api.response.IncidentDetailResponse;
import com.transportplatform.tms.features.incident.api.response.IncidentReferenceDataResponse;
import com.transportplatform.tms.features.incident.api.response.IncidentReferenceOptionResponse;
import com.transportplatform.tms.features.incident.api.response.IncidentSummaryResponse;
import com.transportplatform.tms.features.incident.domain.Incident;
import com.transportplatform.tms.features.organization.domain.Organization;
import com.transportplatform.tms.features.organization.domain.OrganizationRepository;
import com.transportplatform.tms.features.ride.application.RideSpecifications;
import com.transportplatform.tms.features.ride.domain.RideStatus;
import com.transportplatform.tms.features.ride.domain.Ride;
import com.transportplatform.tms.features.ride.domain.RideRepository;
import com.transportplatform.tms.features.rider.domain.Guardian;
import com.transportplatform.tms.features.rider.domain.GuardianRepository;
import com.transportplatform.tms.features.rider.domain.Rider;
import com.transportplatform.tms.features.rider.domain.RiderRepository;
import com.transportplatform.tms.features.vehicle.domain.Vehicle;
import com.transportplatform.tms.features.vehicle.domain.VehicleRepository;
import java.time.Instant;
import java.util.Comparator;
import java.util.EnumSet;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

@Component
public class IncidentMapper {

    private final AppUserRepository appUserRepository;
    private final RideRepository rideRepository;
    private final DriverRepository driverRepository;
    private final VehicleRepository vehicleRepository;
    private final RiderRepository riderRepository;
    private final GuardianRepository guardianRepository;
    private final OrganizationRepository organizationRepository;

    public IncidentMapper(AppUserRepository appUserRepository,
            RideRepository rideRepository,
            DriverRepository driverRepository,
            VehicleRepository vehicleRepository,
            RiderRepository riderRepository,
            GuardianRepository guardianRepository,
            OrganizationRepository organizationRepository) {
        this.appUserRepository = appUserRepository;
        this.rideRepository = rideRepository;
        this.driverRepository = driverRepository;
        this.vehicleRepository = vehicleRepository;
        this.riderRepository = riderRepository;
        this.guardianRepository = guardianRepository;
        this.organizationRepository = organizationRepository;
    }

    public void apply(Incident incident, IncidentUpsertRequest request, Instant reportedAt,
            String reportedByNameSnapshot) {
        incident.setIncidentType(request.incidentType());
        incident.setSeverity(request.severity());
        incident.setTitle(request.title().trim());
        incident.setDescription(request.description().trim());
        incident.setReportedAt(reportedAt);
        incident.setReportedByNameSnapshot(reportedByNameSnapshot);
        incident.setRelatedRideId(request.relatedRideId());
        incident.setRelatedDriverId(request.relatedDriverId());
        incident.setRelatedVehicleId(request.relatedVehicleId());
        incident.setRelatedRiderId(request.relatedRiderId());
        incident.setRelatedGuardianId(request.relatedGuardianId());
        incident.setRelatedOrganizationId(request.relatedOrganizationId());
        incident.setAssignedToUserId(request.assignedToUserId());
        incident.setResolutionSummary(trimToNull(request.resolutionSummary()));
        incident.setRootCauseSummary(trimToNull(request.rootCauseSummary()));
        incident.setCorrectiveActionSummary(trimToNull(request.correctiveActionSummary()));
        incident.setNotes(trimToNull(request.notes()));
    }

    public IncidentSummaryResponse toSummary(Incident incident) {
        return new IncidentSummaryResponse(
                incident.getId(),
                incident.getIncidentCode(),
                incident.getIncidentType(),
                incident.getSeverity(),
                incident.getTitle(),
                incident.getReportedAt(),
                incident.getReportedByNameSnapshot(),
                incident.getAssignedToUserId(),
                resolveAssignedToName(incident),
                incident.getRelatedRideId(),
                resolveRideCode(incident),
                incident.getRelatedDriverId(),
                resolveDriverCode(incident),
                incident.getRelatedVehicleId(),
                resolveVehicleCode(incident),
                incident.getRelatedRiderId(),
                resolveRiderCode(incident),
                incident.getRelatedOrganizationId(),
                resolveOrganizationName(incident),
                incident.getStatus(),
                incident.getCreatedAt(),
                incident.getUpdatedAt());
    }

    public IncidentDetailResponse toDetail(Incident incident) {
        return new IncidentDetailResponse(
                incident.getId(),
                incident.getTenantId(),
                incident.getIncidentCode(),
                incident.getIncidentType(),
                incident.getSeverity(),
                incident.getTitle(),
                incident.getDescription(),
                incident.getReportedAt(),
                incident.getReportedByUserId(),
                incident.getReportedByNameSnapshot(),
                incident.getAssignedToUserId(),
                resolveAssignedToName(incident),
                incident.getRelatedRideId(),
                resolveRideCode(incident),
                incident.getRelatedDriverId(),
                resolveDriverCode(incident),
                incident.getRelatedVehicleId(),
                resolveVehicleCode(incident),
                incident.getRelatedRiderId(),
                resolveRiderCode(incident),
                incident.getRelatedGuardianId(),
                resolveGuardianName(incident),
                incident.getRelatedOrganizationId(),
                resolveOrganizationName(incident),
                incident.getResolutionSummary(),
                incident.getRootCauseSummary(),
                incident.getCorrectiveActionSummary(),
                incident.getNotes(),
                incident.getStatus(),
                incident.getCreatedBy(),
                incident.getCreatedAt(),
                incident.getUpdatedBy(),
                incident.getUpdatedAt());
    }

    public IncidentReferenceDataResponse toReferenceData(String tenantId) {
        return new IncidentReferenceDataResponse(
                appUserRepository.findAllByTenantId(tenantId).stream()
                        .sorted(Comparator.comparing(AppUser::getEmail,
                                Comparator.nullsLast(String::compareToIgnoreCase)))
                        .map(user -> new IncidentReferenceOptionResponse(user.getId(), user.getEmail()))
                        .toList(),
                rideRepository.findAll(
                        RideSpecifications.search(tenantId, "", null, null, null, null, null, null, null, null, null),
                        Sort.by(Sort.Direction.DESC, "scheduledPickupAt")).stream()
                        .limit(100)
                        .filter(ride -> !EnumSet.of(RideStatus.CANCELLED).contains(ride.getStatus()))
                        .map(ride -> new IncidentReferenceOptionResponse(ride.getId(),
                                ride.getRideNumber() + " - "
                                        + fullName(ride.getRider().getFirstName(), ride.getRider().getLastName())))
                        .toList(),
                driverRepository.findAllByTenantId(tenantId).stream()
                        .sorted(Comparator.comparing(Driver::getDriverCode))
                        .map(driver -> new IncidentReferenceOptionResponse(driver.getId(),
                                driver.getDriverCode() + " - " + fullName(driver.getFirstName(), driver.getLastName())))
                        .toList(),
                vehicleRepository.findAllByTenantId(tenantId).stream()
                        .sorted(Comparator.comparing(Vehicle::getVehicleCode))
                        .map(vehicle -> new IncidentReferenceOptionResponse(vehicle.getId(),
                                vehicle.getVehicleCode() + " - " + vehicle.getYear() + " " + vehicle.getMake() + " "
                                        + vehicle.getModel()))
                        .toList(),
                riderRepository.findAllByTenantId(tenantId).stream()
                        .sorted(Comparator.comparing(Rider::getRiderCode))
                        .map(rider -> new IncidentReferenceOptionResponse(rider.getId(),
                                rider.getRiderCode() + " - " + fullName(rider.getFirstName(), rider.getLastName())))
                        .toList(),
                guardianRepository.findAllByTenantId(tenantId).stream()
                        .sorted(Comparator.comparing(Guardian::getLastName))
                        .map(guardian -> new IncidentReferenceOptionResponse(guardian.getId(),
                                fullName(guardian.getFirstName(), guardian.getLastName())))
                        .toList(),
                organizationRepository.findAllByTenantId(tenantId).stream()
                        .sorted(Comparator.comparing(Organization::getName))
                        .map(organization -> new IncidentReferenceOptionResponse(organization.getId(),
                                organization.getOrganizationCode() + " - " + organization.getName()))
                        .toList());
    }

    private String resolveAssignedToName(Incident incident) {
        if (incident.getAssignedToUserId() == null) {
            return null;
        }
        return appUserRepository.findByIdAndTenantId(incident.getAssignedToUserId(), incident.getTenantId())
                .map(AppUser::getEmail)
                .orElse(null);
    }

    private String resolveRideCode(Incident incident) {
        if (incident.getRelatedRideId() == null) {
            return null;
        }
        return rideRepository.findByIdAndTenantId(incident.getRelatedRideId(), incident.getTenantId())
                .map(Ride::getRideNumber)
                .orElse(null);
    }

    private String resolveDriverCode(Incident incident) {
        if (incident.getRelatedDriverId() == null) {
            return null;
        }
        return driverRepository.findByIdAndTenantId(incident.getRelatedDriverId(), incident.getTenantId())
                .map(Driver::getDriverCode)
                .orElse(null);
    }

    private String resolveVehicleCode(Incident incident) {
        if (incident.getRelatedVehicleId() == null) {
            return null;
        }
        return vehicleRepository.findByIdAndTenantId(incident.getRelatedVehicleId(), incident.getTenantId())
                .map(Vehicle::getVehicleCode)
                .orElse(null);
    }

    private String resolveRiderCode(Incident incident) {
        if (incident.getRelatedRiderId() == null) {
            return null;
        }
        return riderRepository.findByIdAndTenantId(incident.getRelatedRiderId(), incident.getTenantId())
                .map(Rider::getRiderCode)
                .orElse(null);
    }

    private String resolveGuardianName(Incident incident) {
        if (incident.getRelatedGuardianId() == null) {
            return null;
        }
        return guardianRepository.findByIdAndTenantId(incident.getRelatedGuardianId(), incident.getTenantId())
                .map(guardian -> fullName(guardian.getFirstName(), guardian.getLastName()))
                .orElse(null);
    }

    private String resolveOrganizationName(Incident incident) {
        if (incident.getRelatedOrganizationId() == null) {
            return null;
        }
        return organizationRepository.findByIdAndTenantId(incident.getRelatedOrganizationId(), incident.getTenantId())
                .map(Organization::getName)
                .orElse(null);
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String fullName(String firstName, String lastName) {
        return java.util.stream.Stream.of(firstName, lastName)
                .filter(value -> value != null && !value.isBlank())
                .reduce((left, right) -> left + " " + right)
                .orElse("Unknown");
    }
}