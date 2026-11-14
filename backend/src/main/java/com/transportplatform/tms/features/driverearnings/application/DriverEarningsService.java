package com.transportplatform.tms.features.driverearnings.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.features.audit.application.AuditLogCommand;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.billing.domain.ChargeSourceType;
import com.transportplatform.tms.features.billing.domain.Invoice;
import com.transportplatform.tms.features.billing.domain.InvoiceLineItem;
import com.transportplatform.tms.features.billing.domain.InvoiceLineItemRepository;
import com.transportplatform.tms.features.billing.domain.InvoiceStatus;
import com.transportplatform.tms.features.driver.domain.Driver;
import com.transportplatform.tms.features.driver.domain.DriverRepository;
import com.transportplatform.tms.features.driverportal.application.DriverPortalAccessService;
import com.transportplatform.tms.features.driverearnings.api.request.DriverEarningsAdjustmentRequest;
import com.transportplatform.tms.features.driverearnings.api.request.DriverEarningsRateRequest;
import com.transportplatform.tms.features.driverearnings.api.request.DriverEarningsReviewRequest;
import com.transportplatform.tms.features.driverearnings.api.response.DriverEarningsEntryResponse;
import com.transportplatform.tms.features.driverearnings.api.response.DriverEarningsSummaryResponse;
import com.transportplatform.tms.features.driverearnings.domain.DriverEarningsEntryType;
import com.transportplatform.tms.features.driverearnings.domain.DriverEarningsLedger;
import com.transportplatform.tms.features.driverearnings.domain.DriverEarningsLedgerRepository;
import com.transportplatform.tms.features.driverearnings.domain.DriverEarningsStatus;
import com.transportplatform.tms.features.ride.domain.Ride;
import com.transportplatform.tms.features.ride.domain.RideRepository;
import com.transportplatform.tms.features.settings.domain.TenantSettings;
import com.transportplatform.tms.features.settings.domain.TenantSettingsRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DriverEarningsService {

    private final DriverEarningsLedgerRepository ledger;
    private final InvoiceLineItemRepository invoiceLineItems;
    private final TenantSettingsRepository settings;
    private final DriverPortalAccessService driverAccess;
    private final CurrentAuthenticatedUserService currentUser;
    private final DriverRepository drivers;
    private final RideRepository rides;
    private final AuditLogService audit;

    public DriverEarningsService(
            DriverEarningsLedgerRepository ledger,
            InvoiceLineItemRepository invoiceLineItems,
            TenantSettingsRepository settings,
            DriverPortalAccessService driverAccess,
            CurrentAuthenticatedUserService currentUser,
            DriverRepository drivers,
            RideRepository rides,
            AuditLogService audit) {
        this.ledger = ledger;
        this.invoiceLineItems = invoiceLineItems;
        this.settings = settings;
        this.driverAccess = driverAccess;
        this.currentUser = currentUser;
        this.drivers = drivers;
        this.rides = rides;
        this.audit = audit;
    }

    @Transactional
    public void createForCompletedRide(Ride ride) {
        if (ride.getDriverId() == null
                || ledger.existsByRideIdAndEntryType(ride.getId(), DriverEarningsEntryType.EARNED)) {
            return;
        }

        TenantSettings tenantSettings = settings.findById(ride.getTenantId()).orElse(null);
        DriverEarningsLedger entry = new DriverEarningsLedger();
        entry.setTenantId(ride.getTenantId());
        entry.setDriverId(ride.getDriverId());
        entry.setRideId(ride.getId());
        entry.setEntryType(DriverEarningsEntryType.EARNED);
        entry.setCurrency(tenantSettings == null ? "USD" : tenantSettings.getCurrency());
        entry.setEarningsRate(tenantSettings == null ? null : tenantSettings.getDriverEarningsRate());
        applyBillableRideAmount(entry, findBillableRideAmount(ride.getTenantId(), ride.getId()));

        if (entry.getEarningsRate() == null || entry.getBillableAmount() == null) {
            entry.setStatus(DriverEarningsStatus.PENDING_CALCULATION);
            entry.setReason(calculationPendingReason(entry.getEarningsRate(), entry.getBillableAmount()));
        } else {
            calculateForReview(entry);
        }

        ledger.save(entry);
        record(entry, "EARNINGS_CREATED", "Driver earnings record created for a completed ride.", null);
    }

    @Transactional
    public void calculatePendingForIssuedRide(String tenantId, Long rideId) {
        TenantSettings tenantSettings = settings.findById(tenantId).orElse(null);
        if (tenantSettings == null || tenantSettings.getDriverEarningsRate() == null) {
            return;
        }
        Optional<BillableRideAmount> billableAmount = findBillableRideAmount(tenantId, rideId);
        if (billableAmount.isEmpty()) {
            return;
        }

        for (DriverEarningsLedger entry : ledger.findAllByTenantIdAndRideIdAndStatusAndEntryType(
                tenantId,
                rideId,
                DriverEarningsStatus.PENDING_CALCULATION,
                DriverEarningsEntryType.EARNED)) {
            Object oldSnapshot = snapshot(entry);
            entry.setEarningsRate(tenantSettings.getDriverEarningsRate());
            applyBillableRideAmount(entry, billableAmount);
            calculateForReview(entry);
            ledger.save(entry);
            record(entry, "EARNINGS_CALCULATED", "Driver earnings calculated from the issued ride charge.", oldSnapshot);
        }
    }

    @Transactional(readOnly = true)
    public DriverEarningsSummaryResponse myEarnings() {
        Driver driver = driverAccess.resolveCurrentDriver();
        List<DriverEarningsLedger> entries = ledger.findAllByTenantIdAndDriverIdOrderByCreatedAtDesc(
                driver.getTenantId(),
                driver.getId());
        return summary(entries, driver.getTenantId());
    }

    @Transactional(readOnly = true)
    public List<DriverEarningsEntryResponse> listAdmin() {
        String tenantId = requireAdminTenant();
        return ledger.findAllByTenantIdOrderByCreatedAtDesc(tenantId)
                .stream()
                .map(entry -> map(entry, true))
                .toList();
    }

    @Transactional
    public BigDecimal updateRate(DriverEarningsRateRequest request) {
        String tenantId = requireAdminTenant();
        TenantSettings tenantSettings = settings.findById(tenantId)
                .orElseThrow(() -> new ApiException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        HttpStatus.NOT_FOUND,
                        "Tenant settings were not found."));
        tenantSettings.setDriverEarningsRate(request.rate().setScale(2, RoundingMode.HALF_UP));
        settings.save(tenantSettings);
        audit.record(new AuditLogCommand(
                null,
                tenantId,
                "DRIVER_EARNINGS",
                "RATE_UPDATED",
                "TENANT_SETTINGS",
                tenantId,
                "Driver earnings rate updated.",
                null,
                Map.of("rate", tenantSettings.getDriverEarningsRate())));
        recalculatePendingForTenant(tenantId, tenantSettings);
        return tenantSettings.getDriverEarningsRate();
    }

    @Transactional(readOnly = true)
    public BigDecimal getRate() {
        return settings.findById(requireAdminTenant())
                .map(TenantSettings::getDriverEarningsRate)
                .orElse(null);
    }

    @Transactional
    public DriverEarningsEntryResponse updateEntry(Long entryId, DriverEarningsReviewRequest request) {
        String tenantId = requireAdminTenant();
        DriverEarningsLedger entry = findEntryForTenant(entryId, tenantId);
        if (entry.getStatus() == DriverEarningsStatus.APPROVED) {
            throw invalidState("Approved earnings cannot be edited. Add a ledger adjustment to correct the amount.");
        }

        Object oldSnapshot = snapshot(entry);
        entry.setAmount(request.amount().setScale(2, RoundingMode.HALF_UP));
        entry.setReason(request.reason().trim());
        entry.setStatus(DriverEarningsStatus.PENDING_REVIEW);
        DriverEarningsLedger saved = ledger.save(entry);
        record(saved, "EARNINGS_UPDATED", "Driver earnings record updated for review.", oldSnapshot);
        return map(saved, true);
    }

    @Transactional
    public DriverEarningsEntryResponse approve(Long entryId) {
        String tenantId = requireAdminTenant();
        DriverEarningsLedger entry = findEntryForTenant(entryId, tenantId);
        if (entry.getStatus() != DriverEarningsStatus.PENDING_REVIEW || entry.getAmount() == null) {
            throw invalidState("Only calculated earnings awaiting review can be approved.");
        }

        Object oldSnapshot = snapshot(entry);
        entry.setStatus(DriverEarningsStatus.APPROVED);
        DriverEarningsLedger saved = ledger.save(entry);
        record(saved, "EARNINGS_APPROVED", "Driver earnings approved by the tenant administrator.", oldSnapshot);
        return map(saved, true);
    }

    @Transactional
    public DriverEarningsEntryResponse adjust(DriverEarningsAdjustmentRequest request) {
        String tenantId = requireAdminTenant();
        if (request.amount().signum() == 0) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    HttpStatus.BAD_REQUEST,
                    "Adjustment amount cannot be zero.");
        }
        drivers.findByIdAndTenantId(request.driverId(), tenantId)
                .orElseThrow(() -> new ApiException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        HttpStatus.NOT_FOUND,
                        "Driver was not found."));

        DriverEarningsLedger entry = new DriverEarningsLedger();
        entry.setTenantId(tenantId);
        entry.setDriverId(request.driverId());
        entry.setEntryType(DriverEarningsEntryType.ADJUSTMENT);
        entry.setStatus(DriverEarningsStatus.APPROVED);
        entry.setAmount(request.amount().setScale(2, RoundingMode.HALF_UP));
        entry.setCurrency(settings.findById(tenantId).map(TenantSettings::getCurrency).orElse("USD"));
        entry.setReason(request.reason().trim());
        DriverEarningsLedger saved = ledger.save(entry);
        record(saved, "ADJUSTMENT_CREATED", "Driver earnings adjustment created.", null);
        return map(saved, true);
    }

    private void recalculatePendingForTenant(String tenantId, TenantSettings tenantSettings) {
        if (tenantSettings.getDriverEarningsRate() == null) {
            return;
        }
        for (DriverEarningsLedger entry : ledger.findAllByTenantIdAndStatusAndEntryType(
                tenantId,
                DriverEarningsStatus.PENDING_CALCULATION,
                DriverEarningsEntryType.EARNED)) {
            Optional<BillableRideAmount> billableAmount = findBillableRideAmount(tenantId, entry.getRideId());
            if (billableAmount.isEmpty()) {
                continue;
            }
            Object oldSnapshot = snapshot(entry);
            entry.setEarningsRate(tenantSettings.getDriverEarningsRate());
            applyBillableRideAmount(entry, billableAmount);
            calculateForReview(entry);
            ledger.save(entry);
            record(entry, "EARNINGS_CALCULATED", "Driver earnings calculated from the issued ride charge.", oldSnapshot);
        }
    }

    private Optional<BillableRideAmount> findBillableRideAmount(String tenantId, Long rideId) {
        if (rideId == null) {
            return Optional.empty();
        }
        List<InvoiceLineItem> rideLineItems = invoiceLineItems
                .findAllByTenantIdAndChargeSourceTypeAndSourceReferenceIdOrderByIdDesc(
                        tenantId,
                        ChargeSourceType.RIDE,
                        rideId);
        Optional<InvoiceLineItem> latestIssuedItem = rideLineItems.stream()
                .filter(item -> isIssued(item.getInvoice().getStatus()))
                .findFirst();
        if (latestIssuedItem.isEmpty()) {
            return Optional.empty();
        }

        Invoice invoice = latestIssuedItem.get().getInvoice();
        BigDecimal amount = rideLineItems.stream()
                .filter(item -> item.getInvoice().getId().equals(invoice.getId()))
                .map(InvoiceLineItem::getLineAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return Optional.of(new BillableRideAmount(amount, invoice.getCurrency()));
    }

    private boolean isIssued(InvoiceStatus status) {
        return status != InvoiceStatus.DRAFT && status != InvoiceStatus.VOID;
    }

    private void applyBillableRideAmount(
            DriverEarningsLedger entry,
            Optional<BillableRideAmount> billableAmount) {
        billableAmount.ifPresent(value -> {
            entry.setBillableAmount(value.amount());
            entry.setCurrency(value.currency());
        });
    }

    private void calculateForReview(DriverEarningsLedger entry) {
        entry.setAmount(entry.getBillableAmount()
                .multiply(entry.getEarningsRate())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP));
        entry.setStatus(DriverEarningsStatus.PENDING_REVIEW);
        entry.setReason("Calculated from the issued ride charge; awaiting tenant admin review.");
    }

    private String calculationPendingReason(BigDecimal rate, BigDecimal billableAmount) {
        if (rate == null && billableAmount == null) {
            return "Awaiting a tenant earnings rate and an issued invoice line for this ride.";
        }
        if (rate == null) {
            return "Awaiting a tenant earnings rate.";
        }
        return "Awaiting an issued invoice line for this ride.";
    }

    private DriverEarningsSummaryResponse summary(List<DriverEarningsLedger> entries, String tenantId) {
        BigDecimal total = entries.stream()
                .filter(entry -> entry.getStatus() == DriverEarningsStatus.APPROVED)
                .map(DriverEarningsLedger::getAmount)
                .filter(amount -> amount != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal pendingReviewTotal = entries.stream()
                .filter(entry -> entry.getStatus() == DriverEarningsStatus.PENDING_REVIEW)
                .map(DriverEarningsLedger::getAmount)
                .filter(amount -> amount != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long pendingCalculationCount = entries.stream()
                .filter(entry -> entry.getStatus() == DriverEarningsStatus.PENDING_CALCULATION)
                .count();
        String currency = settings.findById(tenantId)
                .map(TenantSettings::getCurrency)
                .orElseGet(() -> entries.stream().findFirst().map(DriverEarningsLedger::getCurrency).orElse("USD"));
        return new DriverEarningsSummaryResponse(
                total,
                BigDecimal.valueOf(pendingCalculationCount),
                pendingReviewTotal,
                currency,
                entries.stream().map(entry -> map(entry, false)).toList());
    }

    private DriverEarningsEntryResponse map(DriverEarningsLedger entry, boolean includeContext) {
        String driverName = includeContext
                ? drivers.findByIdAndTenantId(entry.getDriverId(), entry.getTenantId())
                        .map(driver -> driver.getFirstName() + " " + driver.getLastName())
                        .orElse(null)
                : null;
        String rideNumber = includeContext && entry.getRideId() != null
                ? rides.findByIdAndTenantId(entry.getRideId(), entry.getTenantId())
                        .map(Ride::getRideNumber)
                        .orElse(null)
                : null;
        return new DriverEarningsEntryResponse(
                entry.getId(),
                entry.getDriverId(),
                driverName,
                entry.getRideId(),
                rideNumber,
                entry.getEntryType().name(),
                entry.getStatus().name(),
                entry.getAmount(),
                entry.getCurrency(),
                entry.getBillableAmount(),
                entry.getEarningsRate(),
                entry.getReason(),
                entry.getCreatedAt());
    }

    private DriverEarningsLedger findEntryForTenant(Long entryId, String tenantId) {
        return ledger.findByIdAndTenantId(entryId, tenantId)
                .orElseThrow(() -> new ApiException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        HttpStatus.NOT_FOUND,
                        "Driver earnings record was not found."));
    }

    private ApiException invalidState(String message) {
        return new ApiException(ErrorCode.INVALID_STATUS_TRANSITION, HttpStatus.CONFLICT, message);
    }

    private String requireAdminTenant() {
        AuthenticatedUser user = currentUser.requireCurrentUser();
        if (user.tenantId() == null
                || user.getAuthorities().stream()
                        .noneMatch(authority -> authority.getAuthority().equals(RoleName.ROLE_TENANT_ADMIN.name()))) {
            throw new ApiException(
                    ErrorCode.FORBIDDEN,
                    HttpStatus.FORBIDDEN,
                    "A tenant administrator account is required.");
        }
        return user.tenantId();
    }

    private Object snapshot(DriverEarningsLedger entry) {
        return map(entry, false);
    }

    private void record(DriverEarningsLedger entry, String action, String summary, Object oldSnapshot) {
        audit.record(new AuditLogCommand(
                null,
                entry.getTenantId(),
                "DRIVER_EARNINGS",
                action,
                "DRIVER_EARNINGS_LEDGER",
                String.valueOf(entry.getId()),
                summary,
                oldSnapshot,
                snapshot(entry)));
    }

    private record BillableRideAmount(BigDecimal amount, String currency) {
    }
}
