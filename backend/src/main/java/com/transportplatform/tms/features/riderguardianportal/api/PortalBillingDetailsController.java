package com.transportplatform.tms.features.riderguardianportal.api;

import com.transportplatform.tms.common.exception.*;
import com.transportplatform.tms.common.response.ApiResponse;
import com.transportplatform.tms.features.billing.domain.*;
import com.transportplatform.tms.features.portalaccess.domain.PortalSubjectType;
import com.transportplatform.tms.features.riderguardianportal.application.RiderGuardianPortalAccessService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@PreAuthorize("hasAnyRole('RIDER','GUARDIAN')")
@Transactional(readOnly=true)
public class PortalBillingDetailsController {
    public record Line(String description,BigDecimal quantity,BigDecimal unitPrice,BigDecimal amount,LocalDate serviceDate) {}
    public record InvoiceDetail(Long id,String invoiceNumber,LocalDate invoiceDate,LocalDate dueDate,
        BigDecimal subtotal,BigDecimal taxAmount,BigDecimal discountAmount,BigDecimal totalAmount,
        BigDecimal amountPaid,BigDecimal balanceDue,String currency,InvoiceStatus status,List<Line> lines) {}
    public record Receipt(String paymentNumber,String invoiceNumber,LocalDate paymentDate,BigDecimal amount,
        String currency,PaymentStatus status,PaymentMethod paymentMethod) {}
    private final RiderGuardianPortalAccessService access;
    private final InvoiceRepository invoices;
    private final InvoiceLineItemRepository lines;
    private final PaymentRepository payments;
    public PortalBillingDetailsController(RiderGuardianPortalAccessService access,InvoiceRepository invoices,InvoiceLineItemRepository lines,PaymentRepository payments) {
        this.access=access;this.invoices=invoices;this.lines=lines;this.payments=payments;
    }
    @GetMapping("/portal/rider/invoices/{id}")
    public ApiResponse<InvoiceDetail> invoice(@PathVariable Long id) {
        var scope=access.resolveCurrentScope();
        var invoice=invoices.findByIdAndTenantId(id,scope.user().tenantId()).orElseThrow(this::missing);
        ensureAccess(invoice,scope);
        var items=lines.findAllByInvoiceIdAndTenantIdOrderByLineNumberAsc(id,scope.user().tenantId()).stream()
            .map(line->new Line(line.getDescription(),line.getQuantity(),line.getUnitPrice(),line.getLineAmount(),line.getServiceDate())).toList();
        return ApiResponse.success(new InvoiceDetail(invoice.getId(),invoice.getInvoiceNumber(),invoice.getInvoiceDate(),invoice.getDueDate(),invoice.getSubtotal(),invoice.getTaxAmount(),invoice.getDiscountAmount(),invoice.getTotalAmount(),invoice.getAmountPaid(),invoice.getBalanceDue(),invoice.getCurrency(),invoice.getStatus(),items));
    }
    @GetMapping("/portal/rider/payments/{id}/receipt")
    public ApiResponse<Receipt> receipt(@PathVariable Long id) {
        var scope=access.resolveCurrentScope();
        var payment=payments.findByIdAndTenantId(id,scope.user().tenantId()).orElseThrow(this::missing);
        if(payment.getInvoice()==null) throw missing();
        ensureAccess(payment.getInvoice(),scope);
        return ApiResponse.success(new Receipt(payment.getPaymentNumber(),payment.getInvoice().getInvoiceNumber(),payment.getPaymentDate(),payment.getAmount(),payment.getInvoice().getCurrency(),payment.getStatus(),payment.getPaymentMethod()));
    }
    private void ensureAccess(Invoice invoice,RiderGuardianPortalAccessService.ResolvedRiderGuardianScope scope) {
        boolean allowed=Objects.equals(invoice.getTenantId(),scope.user().tenantId()) &&
            (scope.scopeType()==PortalSubjectType.RIDER ? Objects.equals(invoice.getRiderId(),scope.rider().getId()) :
                Objects.equals(invoice.getGuardianId(),scope.guardian().getId()) || scope.linkedRiders().stream().anyMatch(r->Objects.equals(r.getId(),invoice.getRiderId())));
        if(!allowed) throw missing();
    }
    private ApiException missing() {return new ApiException(ErrorCode.RESOURCE_NOT_FOUND,HttpStatus.NOT_FOUND,"Billing record not found for your account.");}
}
