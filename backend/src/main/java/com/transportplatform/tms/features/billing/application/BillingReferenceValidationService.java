package com.transportplatform.tms.features.billing.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.features.billing.domain.BillToType;
import com.transportplatform.tms.features.organization.domain.Contract;
import com.transportplatform.tms.features.organization.domain.ContractRepository;
import com.transportplatform.tms.features.organization.domain.Organization;
import com.transportplatform.tms.features.organization.domain.OrganizationRepository;
import com.transportplatform.tms.features.rider.domain.Guardian;
import com.transportplatform.tms.features.rider.domain.GuardianRepository;
import com.transportplatform.tms.features.rider.domain.Rider;
import com.transportplatform.tms.features.rider.domain.RiderRepository;
import com.transportplatform.tms.features.ride.domain.Ride;
import com.transportplatform.tms.features.ride.domain.RideRepository;
import com.transportplatform.tms.features.route.domain.Route;
import com.transportplatform.tms.features.route.domain.RouteRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class BillingReferenceValidationService {

    private final RiderRepository riderRepository;
    private final GuardianRepository guardianRepository;
    private final OrganizationRepository organizationRepository;
    private final ContractRepository contractRepository;
    private final RideRepository rideRepository;
    private final RouteRepository routeRepository;

    public BillingReferenceValidationService(RiderRepository riderRepository,
            GuardianRepository guardianRepository,
            OrganizationRepository organizationRepository,
            ContractRepository contractRepository,
            RideRepository rideRepository,
            RouteRepository routeRepository) {
        this.riderRepository = riderRepository;
        this.guardianRepository = guardianRepository;
        this.organizationRepository = organizationRepository;
        this.contractRepository = contractRepository;
        this.rideRepository = rideRepository;
        this.routeRepository = routeRepository;
    }

    public ResolvedBillTo resolveBillTo(String tenantId, BillToType billToType, Long billToId) {
        return switch (billToType) {
            case RIDER -> {
                Rider rider = riderRepository.findByIdAndTenantId(billToId, tenantId)
                        .orElseThrow(() -> notFound("Rider was not found."));
                yield new ResolvedBillTo(
                        BillToType.RIDER,
                        rider.getId(),
                        rider.getFirstName() + " " + rider.getLastName(),
                        rider.getId(),
                        null,
                        rider.getOrganizationId(),
                        null);
            }
            case GUARDIAN -> {
                Guardian guardian = guardianRepository.findByIdAndTenantId(billToId, tenantId)
                        .orElseThrow(() -> notFound("Guardian was not found."));
                yield new ResolvedBillTo(
                        BillToType.GUARDIAN,
                        guardian.getId(),
                        guardian.getFirstName() + " " + guardian.getLastName(),
                        null,
                        guardian.getId(),
                        null,
                        null);
            }
            case ORGANIZATION -> {
                Organization organization = organizationRepository.findByIdAndTenantId(billToId, tenantId)
                        .orElseThrow(() -> notFound("Organization was not found."));
                yield new ResolvedBillTo(
                        BillToType.ORGANIZATION,
                        organization.getId(),
                        organization.getName(),
                        null,
                        null,
                        organization.getId(),
                        null);
            }
            case CONTRACT -> {
                Contract contract = contractRepository.findByIdAndTenantId(billToId, tenantId)
                        .orElseThrow(() -> notFound("Contract was not found."));
                yield new ResolvedBillTo(
                        BillToType.CONTRACT,
                        contract.getId(),
                        contract.getContractName(),
                        null,
                        null,
                        contract.getOrganization() == null ? null : contract.getOrganization().getId(),
                        contract.getId());
            }
        };
    }

    public Ride resolveRide(String tenantId, Long rideId) {
        return rideRepository.findByIdAndTenantId(rideId, tenantId)
                .orElseThrow(() -> notFound("Ride was not found."));
    }

    public Route resolveRoute(String tenantId, Long routeId) {
        return routeRepository.findByIdAndTenantId(routeId, tenantId)
                .orElseThrow(() -> notFound("Route was not found."));
    }

    private ApiException notFound(String message) {
        return new ApiException(ErrorCode.RESOURCE_NOT_FOUND, HttpStatus.NOT_FOUND, message);
    }

    public record ResolvedBillTo(
            BillToType billToType,
            Long billToId,
            String billToName,
            Long riderId,
            Long guardianId,
            Long organizationId,
            Long contractId) {
    }
}
