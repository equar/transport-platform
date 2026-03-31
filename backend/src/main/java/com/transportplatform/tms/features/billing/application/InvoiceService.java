package com.transportplatform.tms.features.billing.application;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.exception.ErrorCode;
import com.transportplatform.tms.common.response.PageResponse;
import com.transportplatform.tms.features.audit.application.AuditLogCommand;
import com.transportplatform.tms.features.audit.application.AuditLogService;
import com.transportplatform.tms.features.billing.api.request.BillingPreviewRequest;
import com.transportplatform.tms.features.billing.api.request.InvoiceLineItemUpsertRequest;
import com.transportplatform.tms.features.billing.api.request.InvoiceUpsertRequest;
import com.transportplatform.tms.features.billing.api.request.ManualInvoiceGenerationRequest;
import com.transportplatform.tms.features.billing.api.request.VoidInvoiceRequest;
import com.transportplatform.tms.features.billing.api.response.BillingPreviewResponse;
import com.transportplatform.tms.features.billing.api.response.InvoiceDetailResponse;
import com.transportplatform.tms.features.billing.api.response.InvoiceLineItemResponse;
import com.transportplatform.tms.features.billing.api.response.InvoiceSummaryResponse;
import com.transportplatform.tms.features.billing.domain.BillToType;
import com.transportplatform.tms.features.billing.domain.ChargeSourceType;
import com.transportplatform.tms.features.billing.domain.CollectionNoteRepository;
import com.transportplatform.tms.features.billing.domain.Invoice;
import com.transportplatform.tms.features.billing.domain.InvoiceAgingBucket;
import com.transportplatform.tms.features.billing.domain.InvoiceLineItem;
import com.transportplatform.tms.features.billing.domain.InvoiceLineItemRepository;
import com.transportplatform.tms.features.billing.domain.InvoiceRepository;
import com.transportplatform.tms.features.billing.domain.InvoiceStatus;
import com.transportplatform.tms.features.billing.domain.PaymentRepository;
import com.transportplatform.tms.features.billing.domain.PricingRule;
import com.transportplatform.tms.features.billing.domain.PricingRuleStatus;
import com.transportplatform.tms.features.organization.domain.ContractRepository;
import com.transportplatform.tms.features.organization.domain.ContractType;
import com.transportplatform.tms.features.organization.domain.OrganizationRepository;
import com.transportplatform.tms.features.organization.domain.OrganizationType;
import com.transportplatform.tms.features.organization.domain.ServiceType;
import com.transportplatform.tms.features.rider.domain.RiderRepository;
import com.transportplatform.tms.features.rider.domain.RiderType;
import com.transportplatform.tms.features.ride.domain.Ride;
import com.transportplatform.tms.features.ride.domain.RideTripType;
import com.transportplatform.tms.features.route.domain.Route;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final InvoiceLineItemRepository invoiceLineItemRepository;
    private final BillingAccessService billingAccessService;
    private final BillingReferenceValidationService billingReferenceValidationService;
    private final BillingCalculationService billingCalculationService;
    private final InvoiceFinancialService invoiceFinancialService;
    private final InvoiceMapper invoiceMapper;
    private final InvoiceNumberGenerator invoiceNumberGenerator;
    private final AuditLogService auditLogService;
    private final PaymentRepository paymentRepository;
    private final CollectionNoteRepository collectionNoteRepository;
    private final RiderRepository riderRepository;
    private final OrganizationRepository organizationRepository;
    private final ContractRepository contractRepository;
    private final Clock clock;

    public InvoiceService(InvoiceRepository invoiceRepository,
            InvoiceLineItemRepository invoiceLineItemRepository,
            BillingAccessService billingAccessService,
            BillingReferenceValidationService billingReferenceValidationService,
            BillingCalculationService billingCalculationService,
            InvoiceFinancialService invoiceFinancialService,
            InvoiceMapper invoiceMapper,
            InvoiceNumberGenerator invoiceNumberGenerator,
            AuditLogService auditLogService,
            PaymentRepository paymentRepository,
            CollectionNoteRepository collectionNoteRepository,
            RiderRepository riderRepository,
            OrganizationRepository organizationRepository,
            ContractRepository contractRepository,
            Clock clock) {
        this.invoiceRepository = invoiceRepository;
        this.invoiceLineItemRepository = invoiceLineItemRepository;
        this.billingAccessService = billingAccessService;
        this.billingReferenceValidationService = billingReferenceValidationService;
        this.billingCalculationService = billingCalculationService;
        this.invoiceFinancialService = invoiceFinancialService;
        this.invoiceMapper = invoiceMapper;
        this.invoiceNumberGenerator = invoiceNumberGenerator;
        this.auditLogService = auditLogService;
        this.paymentRepository = paymentRepository;
        this.collectionNoteRepository = collectionNoteRepository;
        this.riderRepository = riderRepository;
        this.organizationRepository = organizationRepository;
        this.contractRepository = contractRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public PageResponse<InvoiceSummaryResponse> searchCompanyInvoices(String keyword,
            InvoiceStatus status,
            InvoiceAgingBucket agingBucket,
            BillToType billToType,
            LocalDate fromDate,
            LocalDate toDate,
            Boolean overdueOnly,
            int page,
            int size,
            String sortBy,
            Sort.Direction sortDirection) {
        String tenantId = billingAccessService.requireCompanyTenantId();
        LocalDate today = LocalDate.now(clock);
        var pageable = PageRequest.of(page, size, Sort.by(sortDirection, resolveSortField(sortBy)));
        var result = invoiceRepository.findAll(
                InvoiceSpecifications.search(tenantId, keyword, status, agingBucket, billToType, fromDate, toDate,
                        overdueOnly,
                        today),
                pageable);
        return PageResponse.from(result.map(invoice -> invoiceMapper.toSummary(
                invoice,
                InvoiceStatusWorkflow.resolveEffectiveStatus(invoice, today),
                invoiceFinancialService.resolveDaysPastDue(invoice, today),
                invoiceFinancialService.resolveAgingBucket(invoice, today))));
    }

    @Transactional(readOnly = true)
    public InvoiceDetailResponse getCompanyInvoice(Long invoiceId) {
        Invoice invoice = billingAccessService.findInvoiceForCompanyScope(invoiceId);
        return toDetail(invoice);
    }

    @Transactional(readOnly = true)
    public List<InvoiceLineItemResponse> listCompanyInvoiceLineItems(Long invoiceId) {
        Invoice invoice = billingAccessService.findInvoiceForCompanyScope(invoiceId);
        return toLineItemResponses(invoiceLineItemRepository.findAllByInvoiceIdAndTenantIdOrderByLineNumberAsc(
                invoice.getId(),
                invoice.getTenantId()));
    }

    @Transactional
    public InvoiceDetailResponse createCompanyInvoice(InvoiceUpsertRequest request) {
        String tenantId = billingAccessService.requireCompanyTenantId();
        BillingReferenceValidationService.ResolvedBillTo billTo = billingReferenceValidationService.resolveBillTo(
                tenantId,
                request.billToType(),
                request.billToId());
        Invoice invoice = new Invoice();
        invoice.setTenantId(tenantId);
        invoice.setInvoiceNumber(invoiceNumberGenerator.generate(tenantId));
        invoice.setStatus(InvoiceStatus.DRAFT);
        invoice.setAmountPaid(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        invoiceMapper.apply(invoice, request, billTo);
        validateInvoice(invoice);
        recalculateTotals(invoice, List.of());
        Invoice saved = invoiceRepository.save(invoice);
        recordInvoiceAudit(saved, "CREATED", "Invoice " + saved.getInvoiceNumber() + " was created.", null,
                snapshot(saved));
        return toDetail(saved);
    }

    @Transactional
    public InvoiceDetailResponse updateCompanyInvoice(Long invoiceId, InvoiceUpsertRequest request) {
        Invoice invoice = billingAccessService.findInvoiceForCompanyScope(invoiceId);
        InvoiceStatusWorkflow.ensureDraftEditable(invoice, LocalDate.now(clock));
        Object oldSnapshot = snapshot(invoice);
        BillingReferenceValidationService.ResolvedBillTo billTo = billingReferenceValidationService.resolveBillTo(
                invoice.getTenantId(),
                request.billToType(),
                request.billToId());
        invoiceMapper.apply(invoice, request, billTo);
        validateInvoice(invoice);
        recalculateTotals(invoice, invoiceLineItemRepository.findAllByInvoiceIdAndTenantIdOrderByLineNumberAsc(
                invoice.getId(), invoice.getTenantId()));
        Invoice saved = invoiceRepository.save(invoice);
        recordInvoiceAudit(saved, "UPDATED", "Invoice " + saved.getInvoiceNumber() + " was updated.", oldSnapshot,
                snapshot(saved));
        return toDetail(saved);
    }

    @Transactional
    public InvoiceLineItemResponse addLineItem(Long invoiceId, InvoiceLineItemUpsertRequest request) {
        Invoice invoice = billingAccessService.findInvoiceForCompanyScope(invoiceId);
        InvoiceStatusWorkflow.ensureDraftEditable(invoice, LocalDate.now(clock));
        List<InvoiceLineItem> existingItems = invoiceLineItemRepository
                .findAllByInvoiceIdAndTenantIdOrderByLineNumberAsc(
                        invoice.getId(),
                        invoice.getTenantId());
        InvoiceLineItem lineItem = invoiceMapper.toLineItem(invoice, request);
        lineItem.setLineNumber(existingItems.size() + 1);
        InvoiceLineItem saved = invoiceLineItemRepository.save(lineItem);
        recalculateAndSaveInvoice(invoice, existingItems, saved, null);
        recordInvoiceAudit(invoice, "LINE_ITEM_ADDED",
                "A line item was added to invoice " + invoice.getInvoiceNumber() + ".",
                null,
                snapshot(saved));
        return invoiceMapper.toLineItemResponse(saved);
    }

    @Transactional
    public InvoiceLineItemResponse updateLineItem(Long lineItemId, InvoiceLineItemUpsertRequest request) {
        InvoiceLineItem lineItem = billingAccessService.findInvoiceLineItemForCompanyScope(lineItemId);
        Invoice invoice = lineItem.getInvoice();
        InvoiceStatusWorkflow.ensureDraftEditable(invoice, LocalDate.now(clock));
        Object oldSnapshot = snapshot(lineItem);
        invoiceMapper.apply(lineItem, request);
        InvoiceLineItem saved = invoiceLineItemRepository.save(lineItem);
        recalculateAndSaveInvoice(invoice,
                invoiceLineItemRepository.findAllByInvoiceIdAndTenantIdOrderByLineNumberAsc(invoice.getId(),
                        invoice.getTenantId()),
                null,
                null);
        recordInvoiceAudit(invoice, "LINE_ITEM_UPDATED",
                "A line item was updated on invoice " + invoice.getInvoiceNumber() + ".",
                oldSnapshot,
                snapshot(saved));
        return invoiceMapper.toLineItemResponse(saved);
    }

    @Transactional
    public void removeLineItem(Long lineItemId) {
        InvoiceLineItem lineItem = billingAccessService.findInvoiceLineItemForCompanyScope(lineItemId);
        Invoice invoice = lineItem.getInvoice();
        InvoiceStatusWorkflow.ensureDraftEditable(invoice, LocalDate.now(clock));
        Object oldSnapshot = snapshot(lineItem);
        invoiceLineItemRepository.delete(lineItem);
        List<InvoiceLineItem> remainingItems = invoiceLineItemRepository
                .findAllByInvoiceIdAndTenantIdOrderByLineNumberAsc(
                        invoice.getId(),
                        invoice.getTenantId());
        resequenceLineItems(remainingItems);
        recalculateTotals(invoice, remainingItems);
        invoiceRepository.save(invoice);
        recordInvoiceAudit(invoice, "LINE_ITEM_REMOVED",
                "A line item was removed from invoice " + invoice.getInvoiceNumber() + ".",
                oldSnapshot,
                null);
    }

    @Transactional
    public InvoiceDetailResponse issueCompanyInvoice(Long invoiceId) {
        Invoice invoice = billingAccessService.findInvoiceForCompanyScope(invoiceId);
        List<InvoiceLineItem> lineItems = invoiceLineItemRepository.findAllByInvoiceIdAndTenantIdOrderByLineNumberAsc(
                invoice.getId(), invoice.getTenantId());
        InvoiceStatusWorkflow.ensureCanIssue(invoice, LocalDate.now(clock));
        if (lineItems.isEmpty()) {
            throw validationFailure("At least one line item is required before issuing an invoice.");
        }
        Object oldSnapshot = snapshot(invoice);
        invoice.setStatus(InvoiceStatus.ISSUED);
        Invoice saved = invoiceRepository.save(invoice);
        recordInvoiceAudit(saved, "ISSUED", "Invoice " + saved.getInvoiceNumber() + " was issued.", oldSnapshot,
                snapshot(saved));
        return toDetail(saved);
    }

    @Transactional
    public InvoiceDetailResponse voidCompanyInvoice(Long invoiceId, VoidInvoiceRequest request) {
        Invoice invoice = billingAccessService.findInvoiceForCompanyScope(invoiceId);
        InvoiceStatusWorkflow.ensureCanVoid(invoice, LocalDate.now(clock));
        if (billingAccessService.invoiceHasActivePayments(invoice)) {
            throw validationFailure("Invoices with active payments cannot be voided until those payments are voided.");
        }
        Object oldSnapshot = snapshot(invoice);
        invoice.setStatus(InvoiceStatus.VOID);
        invoice.setVoidReason(request.reason().trim());
        Invoice saved = invoiceRepository.save(invoice);
        recordInvoiceAudit(saved, "VOIDED", "Invoice " + saved.getInvoiceNumber() + " was voided.", oldSnapshot,
                snapshot(saved));
        return toDetail(saved);
    }

    @Transactional(readOnly = true)
    public BillingPreviewResponse previewManualGeneration(BillingPreviewRequest request) {
        PreviewContext previewContext = buildPreviewContext(request);
        return invoiceMapper.toPreview(
                previewContext.billTo(),
                previewContext.pricingRule() == null ? null : previewContext.pricingRule().getId(),
                previewContext.pricingRule() == null ? null : previewContext.pricingRule().getPricingRuleCode(),
                previewContext.pricingRule() == null ? null : previewContext.pricingRule().getName(),
                previewContext.invoice(),
                request.manualOverrideNote(),
                request.manualOverrideAmount() != null,
                toLineItemResponses(previewContext.lineItems()));
    }

    @Transactional
    public InvoiceDetailResponse generateManualInvoice(ManualInvoiceGenerationRequest request) {
        PreviewContext previewContext = buildPreviewContext(new BillingPreviewRequest(
                request.billToType(),
                request.billToId(),
                request.pricingRuleId(),
                request.routeId(),
                request.rideIds(),
                request.serviceType(),
                request.tripType(),
                request.billingPeriodStart(),
                request.billingPeriodEnd(),
                request.quantity(),
                request.tripCount(),
                request.riderCount(),
                request.currency(),
                request.taxAmount(),
                request.discountAmount(),
                request.manualOverrideAmount(),
                request.manualOverrideNote(),
                request.notes(),
                request.manualLineItems()));
        Invoice invoice = previewContext.invoice();
        invoice.setInvoiceDate(request.invoiceDate());
        invoice.setDueDate(request.dueDate());
        validateInvoice(invoice);
        invoice.setInvoiceNumber(invoiceNumberGenerator.generate(invoice.getTenantId()));
        Invoice savedInvoice = invoiceRepository.save(invoice);
        List<InvoiceLineItem> savedLineItems = new ArrayList<>();
        int lineNumber = 1;
        for (InvoiceLineItem lineItem : previewContext.lineItems()) {
            lineItem.setInvoice(savedInvoice);
            lineItem.setLineNumber(lineNumber++);
            savedLineItems.add(invoiceLineItemRepository.save(lineItem));
        }
        recalculateTotals(savedInvoice, savedLineItems);
        invoiceRepository.save(savedInvoice);
        recordInvoiceAudit(savedInvoice, "GENERATED",
                "Invoice " + savedInvoice.getInvoiceNumber() + " was generated manually.",
                null,
                snapshot(savedInvoice));
        if (request.manualOverrideAmount() != null) {
            recordInvoiceAudit(savedInvoice, "MANUAL_OVERRIDE",
                    "A manual billing override was applied to invoice " + savedInvoice.getInvoiceNumber() + ".",
                    null,
                    Map.of(
                            "amount", request.manualOverrideAmount(),
                            "note", request.manualOverrideNote()));
        }
        return toDetail(savedInvoice);
    }

    private PreviewContext buildPreviewContext(BillingPreviewRequest request) {
        String tenantId = billingAccessService.requireCompanyTenantId();
        validatePreviewRequest(request);
        BillingReferenceValidationService.ResolvedBillTo billTo = billingReferenceValidationService.resolveBillTo(
                tenantId,
                request.billToType(),
                request.billToId());
        Invoice invoice = new Invoice();
        invoice.setTenantId(tenantId);
        invoice.setBillToType(billTo.billToType());
        invoice.setBillToId(billTo.billToId());
        invoice.setBillToNameSnapshot(billTo.billToName());
        invoice.setRiderId(billTo.riderId());
        invoice.setGuardianId(billTo.guardianId());
        invoice.setOrganizationId(billTo.organizationId());
        invoice.setContractId(billTo.contractId());
        invoice.setBillingPeriodStart(request.billingPeriodStart());
        invoice.setBillingPeriodEnd(request.billingPeriodEnd());
        invoice.setTaxAmount(zeroIfNull(request.taxAmount()));
        invoice.setDiscountAmount(zeroIfNull(request.discountAmount()));
        invoice.setCurrency(request.currency().trim().toUpperCase());
        invoice.setNotes(trimToNull(request.notes()));
        invoice.setAmountPaid(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        invoice.setStatus(InvoiceStatus.DRAFT);

        PricingRule pricingRule = resolvePricingRule(tenantId, request, billTo);
        List<InvoiceLineItem> lineItems = new ArrayList<>();
        if (request.rideIds() != null && !request.rideIds().isEmpty()) {
            for (Long rideId : request.rideIds()) {
                Ride ride = billingReferenceValidationService.resolveRide(tenantId, rideId);
                ensureRideMatchesBillTo(ride, billTo);
                lineItems.add(buildRideLineItem(invoice, ride, request, pricingRule));
            }
        } else if (request.manualLineItems() != null && !request.manualLineItems().isEmpty()) {
            for (InvoiceLineItemUpsertRequest manualLineItem : request.manualLineItems()) {
                lineItems.add(invoiceMapper.toLineItem(invoice, manualLineItem));
            }
        } else {
            lineItems.add(buildCalculatedLineItem(invoice, request, pricingRule));
        }

        recalculateTotals(invoice, lineItems);
        return new PreviewContext(invoice, lineItems, billTo, pricingRule);
    }

    private PricingRule resolvePricingRule(String tenantId,
            BillingPreviewRequest request,
            BillingReferenceValidationService.ResolvedBillTo billTo) {
        if (request.manualLineItems() != null && !request.manualLineItems().isEmpty()) {
            return null;
        }
        if (request.manualOverrideAmount() != null) {
            return null;
        }
        if (request.pricingRuleId() != null) {
            PricingRule pricingRule = billingAccessService.findPricingRuleForCompanyScope(request.pricingRuleId());
            PricingRuleStatus effectiveStatus = PricingRuleStatusWorkflow.resolveEffectiveStatus(pricingRule,
                    LocalDate.now(clock));
            if (effectiveStatus != PricingRuleStatus.ACTIVE) {
                throw validationFailure("Only active pricing rules can be used for billing preview or generation.");
            }
            if (pricingRule.getBillToType() != billTo.billToType()) {
                throw validationFailure("The selected pricing rule does not match the selected bill-to type.");
            }
            return pricingRule;
        }

        return billingCalculationService.selectApplicableRule(tenantId,
                new BillingCalculationService.CalculationCriteria(
                        billTo.billToType(),
                        request.serviceType(),
                        resolveRiderType(billTo.riderId()),
                        resolveOrganizationType(billTo.organizationId()),
                        resolveContractType(billTo.contractId()),
                        request.tripType(),
                        request.billingPeriodStart() == null ? LocalDate.now(clock) : request.billingPeriodStart()));
    }

    private InvoiceLineItem buildRideLineItem(Invoice invoice,
            Ride ride,
            BillingPreviewRequest request,
            PricingRule pricingRule) {
        InvoiceLineItem lineItem = new InvoiceLineItem();
        lineItem.setTenantId(invoice.getTenantId());
        lineItem.setInvoice(invoice);
        lineItem.setDescription("Ride " + ride.getRideNumber() + " billing");
        lineItem.setServiceDate(ride.getScheduledPickupAt() == null ? null : ride.getScheduledPickupAt().toLocalDate());
        lineItem.setServicePeriodLabel(ride.getServiceType().name().replace('_', ' '));
        lineItem.setNotes(trimToNull(request.notes()));
        applyCalculatedAmounts(lineItem,
                pricingRule,
                request,
                new BillingCalculationService.CalculationInput(
                        BigDecimal.ONE,
                        1,
                        1,
                        ride.getScheduledPickupAt() == null ? request.billingPeriodStart()
                                : ride.getScheduledPickupAt().toLocalDate(),
                        ride.getScheduledDropoffAt() == null ? request.billingPeriodEnd()
                                : ride.getScheduledDropoffAt().toLocalDate(),
                        ChargeSourceType.RIDE,
                        ride.getId()));
        return lineItem;
    }

    private InvoiceLineItem buildCalculatedLineItem(Invoice invoice,
            BillingPreviewRequest request,
            PricingRule pricingRule) {
        InvoiceLineItem lineItem = new InvoiceLineItem();
        lineItem.setTenantId(invoice.getTenantId());
        lineItem.setInvoice(invoice);
        lineItem.setDescription(resolveLineDescription(request, pricingRule));
        lineItem.setServiceDate(request.billingPeriodStart());
        lineItem.setServicePeriodLabel(
                buildServicePeriodLabel(request.billingPeriodStart(), request.billingPeriodEnd()));
        lineItem.setNotes(trimToNull(request.notes()));
        applyCalculatedAmounts(lineItem,
                pricingRule,
                request,
                new BillingCalculationService.CalculationInput(
                        request.quantity(),
                        request.tripCount() == null ? 0 : request.tripCount(),
                        request.riderCount() == null ? 0 : request.riderCount(),
                        request.billingPeriodStart(),
                        request.billingPeriodEnd(),
                        request.routeId() == null ? null : ChargeSourceType.ROUTE,
                        request.routeId()));
        return lineItem;
    }

    private void applyCalculatedAmounts(InvoiceLineItem lineItem,
            PricingRule pricingRule,
            BillingPreviewRequest request,
            BillingCalculationService.CalculationInput input) {
        if (request.manualOverrideAmount() != null) {
            lineItem.setChargeSourceType(input.sourceType() == null ? ChargeSourceType.MANUAL : input.sourceType());
            lineItem.setSourceReferenceId(input.sourceReferenceId());
            lineItem.setPricingRuleId(pricingRule == null ? null : pricingRule.getId());
            lineItem.setQuantity(BigDecimal.ONE.setScale(2, RoundingMode.HALF_UP));
            lineItem.setUnitPrice(request.manualOverrideAmount().setScale(2, RoundingMode.HALF_UP));
            lineItem.setLineAmount(request.manualOverrideAmount().setScale(2, RoundingMode.HALF_UP));
            return;
        }
        BillingCalculationService.ComputedCharge computedCharge = billingCalculationService.computeCharge(pricingRule,
                input);
        lineItem.setChargeSourceType(computedCharge.chargeSourceType());
        lineItem.setSourceReferenceId(computedCharge.sourceReferenceId());
        lineItem.setPricingRuleId(pricingRule.getId());
        lineItem.setQuantity(computedCharge.quantity());
        lineItem.setUnitPrice(computedCharge.unitPrice());
        lineItem.setLineAmount(computedCharge.lineAmount());
    }

    private void validateInvoice(Invoice invoice) {
        if (invoice.getDueDate().isBefore(invoice.getInvoiceDate())) {
            throw validationFailure("The invoice due date cannot be earlier than the invoice date.");
        }
        if (invoice.getBillingPeriodStart() != null
                && invoice.getBillingPeriodEnd() != null
                && invoice.getBillingPeriodEnd().isBefore(invoice.getBillingPeriodStart())) {
            throw validationFailure("The billing period end date cannot be earlier than the start date.");
        }
    }

    private void validatePreviewRequest(BillingPreviewRequest request) {
        if (request.billingPeriodStart() != null
                && request.billingPeriodEnd() != null
                && request.billingPeriodEnd().isBefore(request.billingPeriodStart())) {
            throw validationFailure("The billing period end date cannot be earlier than the start date.");
        }
        if (request.manualOverrideAmount() != null
                && (request.manualOverrideNote() == null || request.manualOverrideNote().isBlank())) {
            throw validationFailure("A manual override note is required when a manual override amount is supplied.");
        }
    }

    private void ensureRideMatchesBillTo(Ride ride, BillingReferenceValidationService.ResolvedBillTo billTo) {
        boolean matches = switch (billTo.billToType()) {
            case RIDER -> ride.getRider() != null && ride.getRider().getId().equals(billTo.billToId());
            case GUARDIAN -> ride.getGuardian() != null && ride.getGuardian().getId().equals(billTo.billToId());
            case ORGANIZATION ->
                ride.getOrganization() != null && ride.getOrganization().getId().equals(billTo.billToId());
            case CONTRACT -> ride.getContract() != null && ride.getContract().getId().equals(billTo.billToId());
        };
        if (!matches) {
            throw validationFailure("Selected rides must align with the selected bill-to target.");
        }
    }

    private RiderType resolveRiderType(Long riderId) {
        if (riderId == null) {
            return null;
        }
        return riderRepository.findByIdAndTenantId(riderId, billingAccessService.requireCompanyTenantId())
                .map(rider -> rider.getRiderType())
                .orElse(null);
    }

    private OrganizationType resolveOrganizationType(Long organizationId) {
        if (organizationId == null) {
            return null;
        }
        return organizationRepository.findByIdAndTenantId(organizationId, billingAccessService.requireCompanyTenantId())
                .map(organization -> organization.getOrganizationType())
                .orElse(null);
    }

    private ContractType resolveContractType(Long contractId) {
        if (contractId == null) {
            return null;
        }
        return contractRepository.findByIdAndTenantId(contractId, billingAccessService.requireCompanyTenantId())
                .map(contract -> contract.getContractType())
                .orElse(null);
    }

    private void recalculateAndSaveInvoice(Invoice invoice,
            List<InvoiceLineItem> existingItems,
            InvoiceLineItem addedItem,
            InvoiceLineItem removedItem) {
        List<InvoiceLineItem> working = new ArrayList<>(existingItems);
        if (removedItem != null) {
            working.removeIf(item -> item.getId().equals(removedItem.getId()));
        }
        if (addedItem != null) {
            working.add(addedItem);
        }
        resequenceLineItems(working);
        recalculateTotals(invoice, working);
        invoiceRepository.save(invoice);
    }

    private void resequenceLineItems(List<InvoiceLineItem> lineItems) {
        int lineNumber = 1;
        for (InvoiceLineItem lineItem : lineItems) {
            lineItem.setLineNumber(lineNumber++);
            invoiceLineItemRepository.save(lineItem);
        }
    }

    private void recalculateTotals(Invoice invoice, List<InvoiceLineItem> lineItems) {
        invoiceFinancialService.recalculateTotals(invoice, lineItems, LocalDate.now(clock));
    }

    private InvoiceDetailResponse toDetail(Invoice invoice) {
        LocalDate today = LocalDate.now(clock);
        List<InvoiceLineItemResponse> lineItems = toLineItemResponses(
                invoiceLineItemRepository.findAllByInvoiceIdAndTenantIdOrderByLineNumberAsc(invoice.getId(),
                        invoice.getTenantId()));
        List<com.transportplatform.tms.features.billing.api.response.PaymentSummaryResponse> payments = paymentRepository
                .findAllByInvoiceIdAndTenantIdOrderByPaymentDateDescCreatedAtDesc(invoice.getId(),
                        invoice.getTenantId())
                .stream()
                .map(payment -> new com.transportplatform.tms.features.billing.application.PaymentMapper()
                        .toSummary(payment, InvoiceStatusWorkflow.resolveEffectiveStatus(payment.getInvoice(), today)))
                .toList();
        List<com.transportplatform.tms.features.billing.api.response.CollectionNoteResponse> collectionNotes = collectionNoteRepository
                .findAllByInvoiceIdAndTenantIdOrderByCreatedAtDesc(invoice.getId(), invoice.getTenantId())
                .stream()
                .map(note -> new com.transportplatform.tms.features.billing.api.response.CollectionNoteResponse(
                        note.getId(),
                        note.getInvoice().getId(),
                        note.getContactMethod(),
                        note.getNote(),
                        note.getNextFollowUpDate(),
                        note.getCreatedBy(),
                        note.getCreatedAt(),
                        note.getUpdatedBy(),
                        note.getUpdatedAt()))
                .toList();
        return invoiceMapper.toDetail(invoice,
                InvoiceStatusWorkflow.resolveEffectiveStatus(invoice, today),
                invoiceFinancialService.resolveDaysPastDue(invoice, today),
                invoiceFinancialService.resolveAgingBucket(invoice, today),
                lineItems,
                payments,
                collectionNotes);
    }

    private List<InvoiceLineItemResponse> toLineItemResponses(List<InvoiceLineItem> lineItems) {
        return lineItems.stream().map(invoiceMapper::toLineItemResponse).toList();
    }

    private void recordInvoiceAudit(Invoice invoice, String action, String summary, Object oldValue, Object newValue) {
        auditLogService.record(new AuditLogCommand(
                null,
                invoice.getTenantId(),
                "INVOICE",
                action,
                "INVOICE",
                invoice.getId() == null ? invoice.getInvoiceNumber() : invoice.getId().toString(),
                summary,
                oldValue,
                newValue));
    }

    private Object snapshot(Invoice invoice) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("id", invoice.getId());
        values.put("invoiceNumber", invoice.getInvoiceNumber());
        values.put("billToType", invoice.getBillToType() == null ? null : invoice.getBillToType().name());
        values.put("billToId", invoice.getBillToId());
        values.put("billToNameSnapshot", invoice.getBillToNameSnapshot());
        values.put("invoiceDate", invoice.getInvoiceDate());
        values.put("dueDate", invoice.getDueDate());
        values.put("subtotal", invoice.getSubtotal());
        values.put("taxAmount", invoice.getTaxAmount());
        values.put("discountAmount", invoice.getDiscountAmount());
        values.put("totalAmount", invoice.getTotalAmount());
        values.put("balanceDue", invoice.getBalanceDue());
        values.put("status", invoice.getStatus() == null ? null : invoice.getStatus().name());
        values.put("voidReason", invoice.getVoidReason());
        return values;
    }

    private Object snapshot(InvoiceLineItem lineItem) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("id", lineItem.getId());
        values.put("invoiceId", lineItem.getInvoice().getId());
        values.put("lineNumber", lineItem.getLineNumber());
        values.put("description", lineItem.getDescription());
        values.put("chargeSourceType",
                lineItem.getChargeSourceType() == null ? null : lineItem.getChargeSourceType().name());
        values.put("sourceReferenceId", lineItem.getSourceReferenceId());
        values.put("pricingRuleId", lineItem.getPricingRuleId());
        values.put("quantity", lineItem.getQuantity());
        values.put("unitPrice", lineItem.getUnitPrice());
        values.put("lineAmount", lineItem.getLineAmount());
        return values;
    }

    private ApiException validationFailure(String message) {
        return new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST, message);
    }

    private BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String buildServicePeriodLabel(LocalDate start, LocalDate end) {
        if (start == null && end == null) {
            return null;
        }
        if (start != null && end != null) {
            return start + " to " + end;
        }
        return start != null ? start.toString() : end.toString();
    }

    private String resolveLineDescription(BillingPreviewRequest request, PricingRule pricingRule) {
        if (request.routeId() != null) {
            Route route = billingReferenceValidationService.resolveRoute(billingAccessService.requireCompanyTenantId(),
                    request.routeId());
            return "Route " + route.getRouteCode() + " billing";
        }
        if (pricingRule != null) {
            return pricingRule.getName();
        }
        return "Manual billing adjustment";
    }

    private String resolveSortField(String sortBy) {
        String resolved = sortBy == null ? "updatedAt" : sortBy;
        return switch (resolved) {
            case "createdAt", "updatedAt", "invoiceNumber", "invoiceDate", "dueDate", "totalAmount", "balanceDue",
                    "status" ->
                resolved;
            default -> "updatedAt";
        };
    }

    public long countTotalInvoices(String tenantId) {
        return invoiceRepository.countByTenantId(tenantId);
    }

    public long countDraftInvoices(String tenantId) {
        return invoiceRepository.countByTenantIdAndStatus(tenantId, InvoiceStatus.DRAFT);
    }

    public long countIssuedInvoices(String tenantId) {
        return invoiceRepository.countByTenantIdAndStatus(tenantId, InvoiceStatus.ISSUED);
    }

    public long countPaidInvoices(String tenantId) {
        return invoiceRepository.countByTenantIdAndStatus(tenantId, InvoiceStatus.PAID);
    }

    public long countOverdueInvoices(String tenantId) {
        return invoiceRepository.countByTenantIdAndStatusInAndDueDateBeforeAndBalanceDueGreaterThan(
                tenantId,
                EnumSet.of(InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID),
                LocalDate.now(clock),
                BigDecimal.ZERO);
    }

    public BigDecimal calculateOutstandingBalance(String tenantId) {
        return invoiceRepository.findAll(InvoiceSpecifications.search(
                tenantId,
                "",
                null,
                null,
                null,
                null,
                null,
                null,
                LocalDate.now(clock))).stream()
                .filter(invoice -> InvoiceStatusWorkflow.resolveEffectiveStatus(invoice,
                        LocalDate.now(clock)) != InvoiceStatus.VOID)
                .map(Invoice::getBalanceDue)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }

    public BigDecimal calculateTotalBilledAmount(String tenantId) {
        return invoiceRepository.findAll(InvoiceSpecifications.search(
                tenantId,
                "",
                null,
                null,
                null,
                null,
                null,
                null,
                LocalDate.now(clock))).stream()
                .filter(invoice -> InvoiceStatusWorkflow.resolveEffectiveStatus(invoice,
                        LocalDate.now(clock)) != InvoiceStatus.VOID)
                .map(Invoice::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private record PreviewContext(
            Invoice invoice,
            List<InvoiceLineItem> lineItems,
            BillingReferenceValidationService.ResolvedBillTo billTo,
            PricingRule pricingRule) {
    }
}
