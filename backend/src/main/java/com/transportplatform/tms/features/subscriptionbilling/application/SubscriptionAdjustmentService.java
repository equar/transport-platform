package com.transportplatform.tms.features.subscriptionbilling.application;

import com.transportplatform.tms.common.exception.*;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.common.privacy.PhiCipher;
import com.transportplatform.tms.features.audit.application.*;
import com.transportplatform.tms.features.billing.application.FinancialRequestService;
import com.transportplatform.tms.features.subscriptionbilling.api.SubscriptionBillingRecords.*;
import java.math.BigDecimal;
import java.sql.Statement;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;

@Service
public class SubscriptionAdjustmentService {
    private final JdbcTemplate db;private final CurrentAuthenticatedUserService users;private final FinancialRequestService requests;
    private final SubscriptionBillingService billing;private final AuditLogService audit;private final PhiCipher privacy;
    public SubscriptionAdjustmentService(JdbcTemplate db,CurrentAuthenticatedUserService users,FinancialRequestService requests,
            SubscriptionBillingService billing,AuditLogService audit,PhiCipher privacy) {
        this.db=db;this.users=users;this.requests=requests;this.billing=billing;this.audit=audit;this.privacy=privacy;
    }
    @Transactional(isolation=Isolation.READ_COMMITTED)
    public InvoiceDetail adjust(long invoiceId,AdjustmentRequest request,String key) {
        var user=users.requireCurrentUser();
        if(user.getAuthorities().stream().noneMatch(a->a.getAuthority().equals("ROLE_PLATFORM_ADMIN")))
            throw new ApiException(ErrorCode.FORBIDDEN,HttpStatus.FORBIDDEN,"A platform administrator is required.");
        String tenant=billing.invoice(invoiceId,null).tenantId();
        requests.execute(tenant,key,"SUBSCRIPTION_ADJUSTMENT",List.of(invoiceId,request),()->{
            db.queryForList("SELECT id FROM platform_subscription_invoices WHERE id=? AND tenant_id=? FOR UPDATE",invoiceId,tenant);
            var invoice=billing.invoice(invoiceId,null);
            if(invoice.collectionMode().equals("AUTOMATIC") && !Set.of("NOT_ATTEMPTED","SETTLED").contains(invoice.collectionState()))
                throw invalid("Reconcile the outstanding automatic collection before adjusting this invoice.");
            BigDecimal paid=invoice.paidAmount(), credit=invoice.creditedAmount();
            if(Set.of("REFUND","PAYMENT_REVERSAL").contains(request.kind())) {
                if(request.paymentId()==null) throw invalid("Select the original payment.");
                var payments=db.queryForList("SELECT amount,source FROM platform_subscription_payments WHERE id=? AND invoice_id=?",request.paymentId(),invoiceId);
                if(payments.isEmpty()) throw invalid("Payment was not found on this invoice.");
                if(!"MANUAL".equals(payments.getFirst().get("source"))) throw invalid("Processor payments require verified provider reconciliation before a manual correction.");
                BigDecimal refunded=db.queryForObject("SELECT COALESCE(SUM(amount),0) FROM platform_subscription_adjustments WHERE invoice_id=? AND payment_id=? AND kind IN ('REFUND','PAYMENT_REVERSAL')",BigDecimal.class,invoiceId,request.paymentId());
                if(request.amount().compareTo(((BigDecimal)payments.getFirst().get("amount")).subtract(refunded))>0 || request.amount().compareTo(paid)>0)
                    throw invalid("The correction exceeds this payment's remaining amount.");
                paid=paid.subtract(request.amount());
            } else if(request.kind().equals("CREDIT")) {
                if(request.paymentId()!=null || request.amount().compareTo(invoice.amount().subtract(paid))>0)
                    throw invalid("Credits cannot exceed the unpaid invoice balance. Refund an actual payment separately.");
                credit=credit.add(request.amount());
            } else if(request.kind().equals("CREDIT_REVERSAL")) {
                if(request.paymentId()!=null || request.amount().compareTo(credit)>0) throw invalid("Credit reversal exceeds existing credits.");
                credit=credit.subtract(request.amount());
            } else throw invalid("Choose a supported correction type.");
            if(request.amount().signum()<=0 || request.amount().scale()>2) throw invalid("Enter a positive USD amount with at most two decimal places.");
            var holder=new GeneratedKeyHolder();
            db.update(c->{var p=c.prepareStatement("INSERT INTO platform_subscription_adjustments(tenant_id,invoice_id,payment_id,kind,amount,reference,reason,created_by) VALUES(?,?,?,?,?,?,?,?)",Statement.RETURN_GENERATED_KEYS);
                p.setString(1,tenant);p.setLong(2,invoiceId);p.setObject(3,request.paymentId());p.setString(4,request.kind());p.setBigDecimal(5,request.amount());p.setString(6,request.reference().trim());p.setString(7,privacy.encrypt(request.reason().trim(),"text"));p.setLong(8,user.id());return p;},holder);
            db.update("UPDATE platform_subscription_invoices SET paid_amount=?,credited_amount=?,status=? WHERE id=?",paid,credit,paid.add(credit).compareTo(invoice.originalAmount())==0?"PAID":"ISSUED",invoiceId);
            long id=Objects.requireNonNull(holder.getKey()).longValue();
            audit.record(new AuditLogCommand(null,tenant,"SUBSCRIPTION_BILLING",request.kind(),"SUBSCRIPTION_ADJUSTMENT",Long.toString(id),"Manual subscription adjustment recorded.",null,Map.of("invoiceId",invoiceId,"amount",request.amount(),"currency","USD")));
            return id;
        });
        return billing.detail(invoiceId,null);
    }
    private ApiException invalid(String message) { return new ApiException(ErrorCode.RESOURCE_CONFLICT,HttpStatus.CONFLICT,message); }
}
