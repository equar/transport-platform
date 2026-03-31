package com.transportplatform.tms.features.vehicle.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.audit.application.AuditLogCommand;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.vehicle.api.request.VehicleUpsertRequest;
import com.transportplatform.tms.features.vehicle.api.response.VehicleComplianceSummaryResponse;
import com.transportplatform.tms.features.vehicle.api.response.VehicleResponse;
import com.transportplatform.tms.features.vehicle.domain.Vehicle;
import com.transportplatform.tms.features.vehicle.domain.VehicleComplianceStatus;
import com.transportplatform.tms.features.vehicle.domain.VehicleOwnershipType;
import com.transportplatform.tms.features.vehicle.domain.VehicleRepository;
import com.transportplatform.tms.features.vehicle.domain.VehicleStatus;
import java.time.Clock;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Pattern;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VehicleService {

    private static final Pattern VIN_PATTERN = Pattern.compile("^[A-HJ-NPR-Z0-9]{17}$");
    private static final Pattern PLATE_PATTERN = Pattern.compile("^[A-Z0-9 -]{2,30}$");

    private final VehicleRepository vehicleRepository;
    private final VehicleMapper vehicleMapper;
    private final VehicleAccessService vehicleAccessService;
    private final VehicleCodeGenerator vehicleCodeGenerator;
    private final VehicleComplianceSummaryService vehicleComplianceSummaryService;
    private final AuditLogService auditLogService;
    private final Clock clock;

    public VehicleService(VehicleRepository vehicleRepository,
            VehicleMapper vehicleMapper,
            VehicleAccessService vehicleAccessService,
            VehicleCodeGenerator vehicleCodeGenerator,
            VehicleComplianceSummaryService vehicleComplianceSummaryService,
            AuditLogService auditLogService,
            Clock clock) {
        this.vehicleRepository = vehicleRepository;
        this.vehicleMapper = vehicleMapper;
        this.vehicleAccessService = vehicleAccessService;
        this.vehicleCodeGenerator = vehicleCodeGenerator;
        this.vehicleComplianceSummaryService = vehicleComplianceSummaryService;
        this.auditLogService = auditLogService;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public PageResponse<VehicleResponse> searchCompanyVehicles(String keyword,
            VehicleStatus status,
            VehicleOwnershipType ownershipType,
            String serviceType,
            int page,
            int size,
            String sortBy,
            Sort.Direction sortDirection) {
        String tenantId = vehicleAccessService.requireCompanyTenantId();
        var pageable = PageRequest.of(page, size, Sort.by(sortDirection, resolveSortField(sortBy)));
        var result = vehicleRepository.findAll(
                VehicleSpecifications.search(tenantId, keyword, status, ownershipType, serviceType),
                pageable);
        Map<Long, VehicleComplianceSummaryResponse> summaries = vehicleComplianceSummaryService
                .getSummaries(tenantId, result.getContent());
        return PageResponse.from(result.map(vehicle -> vehicleMapper.toResponse(
                vehicle,
                summaries.getOrDefault(vehicle.getId(),
                        vehicleComplianceSummaryService.getSummary(tenantId, vehicle)))));
    }

    @Transactional(readOnly = true)
    public VehicleResponse getCompanyVehicle(Long vehicleId) {
        Vehicle vehicle = vehicleAccessService.findVehicleForCompanyScope(vehicleId);
        return vehicleMapper.toResponse(
                vehicle,
                vehicleComplianceSummaryService.getSummary(vehicle.getTenantId(), vehicle));
    }

    @Transactional
    public VehicleResponse createCompanyVehicle(VehicleUpsertRequest request) {
        String tenantId = vehicleAccessService.requireCompanyTenantId();
        Vehicle vehicle = new Vehicle();
        vehicle.setTenantId(tenantId);
        vehicle.setVehicleCode(vehicleCodeGenerator.generate(tenantId));
        vehicle.setStatus(VehicleStatus.INACTIVE);
        vehicleMapper.apply(vehicle, request);
        validateBusinessRules(vehicle, null);
        Vehicle saved = vehicleRepository.save(vehicle);
        recordAudit(saved, "CREATED", "Vehicle " + saved.getVehicleCode() + " was created.", null, snapshot(saved));
        return vehicleMapper.toResponse(saved, vehicleComplianceSummaryService.getSummary(tenantId, saved));
    }

    @Transactional
    public VehicleResponse updateCompanyVehicle(Long vehicleId, VehicleUpsertRequest request) {
        Vehicle vehicle = vehicleAccessService.findVehicleForCompanyScope(vehicleId);
        Object oldSnapshot = snapshot(vehicle);
        vehicleMapper.apply(vehicle, request);
        validateBusinessRules(vehicle, vehicle.getId());
        Vehicle saved = vehicleRepository.save(vehicle);
        recordAudit(saved, "UPDATED", "Vehicle " + saved.getVehicleCode() + " was updated.", oldSnapshot,
                snapshot(saved));
        return vehicleMapper.toResponse(saved, vehicleComplianceSummaryService.getSummary(saved.getTenantId(), saved));
    }

    @Transactional
    public VehicleResponse activateCompanyVehicle(Long vehicleId) {
        Vehicle vehicle = vehicleAccessService.findVehicleForCompanyScope(vehicleId);
        VehicleComplianceSummaryResponse complianceSummary = vehicleComplianceSummaryService
                .getSummary(vehicle.getTenantId(), vehicle);
        VehicleStatusWorkflow.ensureCanActivate(vehicle);
        validateActivationReadiness(vehicle, complianceSummary);
        return updateStatus(vehicle, VehicleStatus.ACTIVE, "ACTIVATED",
                "Vehicle " + vehicle.getVehicleCode() + " was activated.");
    }

    @Transactional
    public VehicleResponse suspendCompanyVehicle(Long vehicleId) {
        Vehicle vehicle = vehicleAccessService.findVehicleForCompanyScope(vehicleId);
        VehicleStatusWorkflow.ensureCanSuspend(vehicle.getStatus());
        return updateStatus(vehicle, VehicleStatus.SUSPENDED, "SUSPENDED",
                "Vehicle " + vehicle.getVehicleCode() + " was suspended.");
    }

    @Transactional
    public VehicleResponse markCompanyVehicleMaintenance(Long vehicleId) {
        Vehicle vehicle = vehicleAccessService.findVehicleForCompanyScope(vehicleId);
        VehicleStatusWorkflow.ensureCanMarkMaintenance(vehicle.getStatus());
        return updateStatus(vehicle, VehicleStatus.MAINTENANCE, "MAINTENANCE_MARKED",
                "Vehicle " + vehicle.getVehicleCode() + " was moved into maintenance.");
    }

    @Transactional
    public VehicleResponse markCompanyVehicleOutOfService(Long vehicleId) {
        Vehicle vehicle = vehicleAccessService.findVehicleForCompanyScope(vehicleId);
        VehicleStatusWorkflow.ensureCanMarkOutOfService(vehicle.getStatus());
        return updateStatus(vehicle, VehicleStatus.OUT_OF_SERVICE, "OUT_OF_SERVICE_MARKED",
                "Vehicle " + vehicle.getVehicleCode() + " was marked out of service.");
    }

    @Transactional
    public VehicleResponse deactivateCompanyVehicle(Long vehicleId) {
        Vehicle vehicle = vehicleAccessService.findVehicleForCompanyScope(vehicleId);
        VehicleStatusWorkflow.ensureCanDeactivate(vehicle.getStatus());
        return updateStatus(vehicle, VehicleStatus.INACTIVE, "DEACTIVATED",
                "Vehicle " + vehicle.getVehicleCode() + " was marked inactive.");
    }

    private VehicleResponse updateStatus(Vehicle vehicle, VehicleStatus status, String action, String summary) {
        Object oldSnapshot = snapshot(vehicle);
        vehicle.setStatus(status);
        Vehicle saved = vehicleRepository.save(vehicle);
        recordAudit(saved, action, summary, oldSnapshot, snapshot(saved));
        return vehicleMapper.toResponse(saved, vehicleComplianceSummaryService.getSummary(saved.getTenantId(), saved));
    }

    private void validateBusinessRules(Vehicle vehicle, Long currentVehicleId) {
        int maxYear = LocalDate.now(clock).plusYears(1).getYear();
        if (vehicle.getYear() < 1980 || vehicle.getYear() > maxYear) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "Vehicle year must be between 1980 and next calendar year.");
        }
        if (vehicle.getWheelchairCapacity() != null && vehicle.getWheelchairCapacity() > vehicle.getCapacity()) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "Wheelchair capacity cannot exceed total capacity.");
        }
        if (vehicle.getMileage() != null && vehicle.getMileage() < 0) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "Mileage cannot be negative.");
        }
        if (vehicle.getAssignedDriverId() != null && vehicle.getAssignedDriverId() <= 0) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "Assigned driver reference must be positive when provided.");
        }
        if (vehicle.getVin() != null && !VIN_PATTERN.matcher(vehicle.getVin()).matches()) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "VIN must be a valid 17-character vehicle identification number.");
        }
        if (!PLATE_PATTERN.matcher(vehicle.getPlateNumber()).matches()) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "Plate number must contain only letters, numbers, spaces, or hyphens.");
        }
        if (vehicle.getServiceTypesSupported().stream().anyMatch(serviceType -> serviceType.length() > 80)) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "Service type values must be 80 characters or fewer.");
        }
        if (vehicle.getVin() != null) {
            boolean vinConflict = currentVehicleId == null
                    ? vehicleRepository.existsByTenantIdAndVinIgnoreCase(vehicle.getTenantId(), vehicle.getVin())
                    : vehicleRepository.existsByTenantIdAndVinIgnoreCaseAndIdNot(
                            vehicle.getTenantId(),
                            vehicle.getVin(),
                            currentVehicleId);
            if (vinConflict) {
                throw new ApiException(
                        ErrorCode.RESOURCE_CONFLICT,
                        HttpStatus.CONFLICT,
                        "A vehicle with the same VIN already exists for this tenant.");
            }
        }
        boolean plateConflict = currentVehicleId == null
                ? vehicleRepository.existsByTenantIdAndPlateNumberIgnoreCaseAndPlateStateIgnoreCase(
                        vehicle.getTenantId(),
                        vehicle.getPlateNumber(),
                        vehicle.getPlateState())
                : vehicleRepository.existsByTenantIdAndPlateNumberIgnoreCaseAndPlateStateIgnoreCaseAndIdNot(
                        vehicle.getTenantId(),
                        vehicle.getPlateNumber(),
                        vehicle.getPlateState(),
                        currentVehicleId);
        if (plateConflict) {
            throw new ApiException(
                    ErrorCode.RESOURCE_CONFLICT,
                    HttpStatus.CONFLICT,
                    "A vehicle with the same plate number and plate state already exists for this tenant.");
        }
    }

    private void validateActivationReadiness(Vehicle vehicle, VehicleComplianceSummaryResponse complianceSummary) {
        LocalDate today = LocalDate.now(clock);
        if (vehicle.getInsuranceExpiryDate() == null || vehicle.getInsuranceExpiryDate().isBefore(today)) {
            throw new ApiException(
                    ErrorCode.INVALID_STATUS_TRANSITION,
                    HttpStatus.BAD_REQUEST,
                    "An active vehicle must have a current insurance expiry date.");
        }
        if (vehicle.getRegistrationExpiryDate() == null || vehicle.getRegistrationExpiryDate().isBefore(today)) {
            throw new ApiException(
                    ErrorCode.INVALID_STATUS_TRANSITION,
                    HttpStatus.BAD_REQUEST,
                    "An active vehicle must have a current registration expiry date.");
        }
        if (vehicle.getInspectionExpiryDate() == null || vehicle.getInspectionExpiryDate().isBefore(today)) {
            throw new ApiException(
                    ErrorCode.INVALID_STATUS_TRANSITION,
                    HttpStatus.BAD_REQUEST,
                    "An active vehicle must have a current inspection expiry date.");
        }
        if (complianceSummary.overallStatus() == VehicleComplianceStatus.NON_COMPLIANT) {
            throw new ApiException(
                    ErrorCode.INVALID_STATUS_TRANSITION,
                    HttpStatus.BAD_REQUEST,
                    "Vehicle compliance requirements must be satisfied before activation.");
        }
    }

    private void recordAudit(Vehicle vehicle, String action, String summary, Object oldValue, Object newValue) {
        auditLogService.record(new AuditLogCommand(
                null,
                vehicle.getTenantId(),
                "VEHICLE",
                action,
                "VEHICLE",
                resolveEntityId(vehicle),
                summary,
                oldValue,
                newValue));
    }

    private String resolveEntityId(Vehicle vehicle) {
        if (vehicle.getId() != null) {
            return vehicle.getId().toString();
        }
        return vehicle.getVehicleCode();
    }

    private Object snapshot(Vehicle vehicle) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("id", vehicle.getId());
        values.put("vehicleCode", vehicle.getVehicleCode());
        values.put("tenantId", vehicle.getTenantId());
        values.put("status", vehicle.getStatus() == null ? null : vehicle.getStatus().name());
        values.put("ownershipType", vehicle.getOwnershipType() == null ? null : vehicle.getOwnershipType().name());
        values.put("make", vehicle.getMake());
        values.put("model", vehicle.getModel());
        values.put("year", vehicle.getYear());
        values.put("vin", vehicle.getVin());
        values.put("plateNumber", vehicle.getPlateNumber());
        values.put("plateState", vehicle.getPlateState());
        values.put("capacity", vehicle.getCapacity());
        values.put("wheelchairCapacity", vehicle.getWheelchairCapacity());
        values.put("serviceTypesSupported", vehicle.getServiceTypesSupported());
        values.put("insuranceExpiryDate", vehicle.getInsuranceExpiryDate());
        values.put("registrationExpiryDate", vehicle.getRegistrationExpiryDate());
        values.put("inspectionExpiryDate", vehicle.getInspectionExpiryDate());
        return values;
    }

    private String resolveSortField(String sortBy) {
        String resolved = sortBy == null ? "updatedAt" : sortBy;
        return switch (resolved) {
            case "createdAt", "updatedAt", "vehicleCode", "make", "model", "year", "plateNumber",
                    "status", "insuranceExpiryDate", "registrationExpiryDate", "inspectionExpiryDate",
                    "capacity" ->
                resolved;
            default -> "updatedAt";
        };
    }
}