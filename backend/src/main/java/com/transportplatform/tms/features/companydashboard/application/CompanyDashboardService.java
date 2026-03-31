package com.transportplatform.tms.features.companydashboard.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.auth.domain.AppUserRepository;
import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.auth.domain.UserStatus;
import com.transportplatform.tms.features.driver.application.DriverComplianceSummaryService;
import com.transportplatform.tms.features.driver.domain.DriverRepository;
import com.transportplatform.tms.features.driver.domain.DriverStatus;
import com.transportplatform.tms.features.organization.domain.ContractRepository;
import com.transportplatform.tms.features.organization.domain.ContractStatus;
import com.transportplatform.tms.features.organization.domain.OrganizationRepository;
import com.transportplatform.tms.features.organization.domain.OrganizationStatus;
import com.transportplatform.tms.features.organization.domain.ServiceAreaRepository;
import com.transportplatform.tms.features.organization.domain.ServiceAreaStatus;
import com.transportplatform.tms.features.ride.domain.RecurringRideScheduleRepository;
import com.transportplatform.tms.features.ride.domain.RideRecurrenceStatus;
import com.transportplatform.tms.features.ride.domain.RideRepository;
import com.transportplatform.tms.features.rider.domain.RiderRepository;
import com.transportplatform.tms.features.rider.domain.RiderStatus;
import com.transportplatform.tms.features.vehicle.application.VehicleComplianceSummaryService;
import com.transportplatform.tms.features.vehicle.domain.Vehicle;
import com.transportplatform.tms.features.vehicle.domain.VehicleRepository;
import com.transportplatform.tms.features.vehicle.domain.VehicleStatus;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CompanyDashboardService {

        private final AppUserRepository appUserRepository;
        private final CurrentAuthenticatedUserService currentAuthenticatedUserService;
        private final AuditLogService auditLogService;
        private final RiderRepository riderRepository;
        private final OrganizationRepository organizationRepository;
        private final ContractRepository contractRepository;
        private final ServiceAreaRepository serviceAreaRepository;
        private final DriverRepository driverRepository;
        private final DriverComplianceSummaryService driverComplianceSummaryService;
        private final VehicleRepository vehicleRepository;
        private final VehicleComplianceSummaryService vehicleComplianceSummaryService;
        private final RideRepository rideRepository;
        private final RecurringRideScheduleRepository recurringRideScheduleRepository;

        public CompanyDashboardService(AppUserRepository appUserRepository,
                        CurrentAuthenticatedUserService currentAuthenticatedUserService,
                        AuditLogService auditLogService,
                        RiderRepository riderRepository,
                        OrganizationRepository organizationRepository,
                        ContractRepository contractRepository,
                        ServiceAreaRepository serviceAreaRepository,
                        DriverRepository driverRepository,
                        DriverComplianceSummaryService driverComplianceSummaryService,
                        VehicleRepository vehicleRepository,
                        VehicleComplianceSummaryService vehicleComplianceSummaryService,
                        RideRepository rideRepository,
                        RecurringRideScheduleRepository recurringRideScheduleRepository) {
                this.appUserRepository = appUserRepository;
                this.currentAuthenticatedUserService = currentAuthenticatedUserService;
                this.auditLogService = auditLogService;
                this.riderRepository = riderRepository;
                this.organizationRepository = organizationRepository;
                this.contractRepository = contractRepository;
                this.serviceAreaRepository = serviceAreaRepository;
                this.driverRepository = driverRepository;
                this.driverComplianceSummaryService = driverComplianceSummaryService;
                this.vehicleRepository = vehicleRepository;
                this.vehicleComplianceSummaryService = vehicleComplianceSummaryService;
                this.rideRepository = rideRepository;
                this.recurringRideScheduleRepository = recurringRideScheduleRepository;
        }

        @Transactional(readOnly = true)
        public CompanyDashboardSummaryResponse getSummary() {
                AuthenticatedUser currentUser = currentAuthenticatedUserService.requireCurrentUser();
                boolean hasCompanyAdminRole = currentUser.getAuthorities().stream()
                                .anyMatch(authority -> authority.getAuthority()
                                                .equals(RoleName.ROLE_TENANT_ADMIN.name()));
                if (!hasCompanyAdminRole || currentUser.tenantId() == null || currentUser.tenantId().isBlank()) {
                        throw new ApiException(
                                        ErrorCode.FORBIDDEN,
                                        HttpStatus.FORBIDDEN,
                                        "A company administrator account is required to access the company dashboard.");
                }

                String tenantId = currentUser.tenantId();
                LocalDate today = LocalDate.now();
                List<com.transportplatform.tms.features.driver.domain.Driver> drivers = driverRepository
                                .findAllByTenantId(tenantId);
                List<Vehicle> vehicles = vehicleRepository.findAllByTenantId(tenantId);
                return new CompanyDashboardSummaryResponse(
                                appUserRepository.countByTenantId(tenantId),
                                appUserRepository.countByTenantIdAndStatus(tenantId, UserStatus.ACTIVE),
                                appUserRepository.countByTenantIdAndStatus(tenantId, UserStatus.SUSPENDED),
                                appUserRepository.countByTenantIdAndStatus(tenantId, UserStatus.INVITED),
                                riderRepository.countByTenantId(tenantId),
                                riderRepository.countByTenantIdAndStatus(tenantId, RiderStatus.ACTIVE),
                                riderRepository.countByTenantIdAndStatus(tenantId, RiderStatus.SUSPENDED),
                                riderRepository.countByTenantIdAndStatus(tenantId, RiderStatus.WAITLISTED),
                                riderRepository.countByTenantIdAndWheelchairRequiredTrue(tenantId),
                                riderRepository.countByTenantIdAndEscortRequiredTrue(tenantId),
                                organizationRepository.countByTenantId(tenantId),
                                organizationRepository.countByTenantIdAndStatus(tenantId, OrganizationStatus.ACTIVE),
                                organizationRepository.countByTenantIdAndStatus(tenantId, OrganizationStatus.SUSPENDED),
                                contractRepository.countByTenantId(tenantId),
                                contractRepository.countByTenantIdAndStatusAndEndDateGreaterThanEqual(tenantId,
                                                ContractStatus.ACTIVE,
                                                today)
                                                + contractRepository.countByTenantIdAndStatusAndEndDateIsNull(tenantId,
                                                                ContractStatus.ACTIVE),
                                contractRepository.countByTenantIdAndStatusInAndEndDateBetween(
                                                tenantId,
                                                List.of(ContractStatus.ACTIVE, ContractStatus.SUSPENDED),
                                                today,
                                                today.plusDays(30)),
                                serviceAreaRepository.countByTenantId(tenantId),
                                serviceAreaRepository.countByTenantIdAndStatus(tenantId, ServiceAreaStatus.ACTIVE),
                                drivers.size(),
                                driverRepository.countByTenantIdAndStatus(tenantId, DriverStatus.ACTIVE),
                                driverRepository.countByTenantIdAndStatus(tenantId, DriverStatus.SUSPENDED),
                                driverRepository.countByTenantIdAndStatus(tenantId, DriverStatus.APPLIED)
                                                + driverRepository.countByTenantIdAndStatus(tenantId,
                                                                DriverStatus.PENDING_REVIEW),
                                driverComplianceSummaryService.countDriversWithExpiredDocuments(tenantId, drivers),
                                driverComplianceSummaryService.countDriversWithMissingRequiredDocuments(tenantId,
                                                drivers),
                                vehicles.size(),
                                vehicleRepository.countByTenantIdAndStatus(tenantId, VehicleStatus.ACTIVE),
                                vehicleRepository.countByTenantIdAndStatus(tenantId, VehicleStatus.SUSPENDED),
                                vehicleRepository.countByTenantIdAndStatus(tenantId, VehicleStatus.MAINTENANCE),
                                vehicleRepository.countByTenantIdAndStatus(tenantId, VehicleStatus.OUT_OF_SERVICE),
                                vehicleComplianceSummaryService.countVehiclesWithExpiredDocuments(tenantId, vehicles),
                                vehicleComplianceSummaryService.countVehiclesWithMissingRequiredDocuments(tenantId,
                                                vehicles),
                                rideRepository.countByTenantId(tenantId),
                                rideRepository.countByTenantIdAndStatus(tenantId,
                                                com.transportplatform.tms.features.ride.domain.RideStatus.REQUESTED)
                                                + rideRepository.countByTenantIdAndStatus(tenantId,
                                                                com.transportplatform.tms.features.ride.domain.RideStatus.PENDING_REVIEW),
                                rideRepository.countByTenantIdAndStatus(tenantId,
                                                com.transportplatform.tms.features.ride.domain.RideStatus.SCHEDULED),
                                rideRepository.countByTenantIdAndStatus(tenantId,
                                                com.transportplatform.tms.features.ride.domain.RideStatus.CANCELLED),
                                rideRepository.countByTenantIdAndStatus(tenantId,
                                                com.transportplatform.tms.features.ride.domain.RideStatus.COMPLETED),
                                recurringRideScheduleRepository.countByTenantId(tenantId),
                                recurringRideScheduleRepository.countByTenantIdAndStatus(tenantId,
                                                RideRecurrenceStatus.ACTIVE),
                                auditLogService.getRecentCompanyActivity(8));
        }
}