package com.transportplatform.tms.features.driverearnings.application;

import com.transportplatform.tms.common.exception.*;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.common.privacy.PhiCipher;
import com.transportplatform.tms.features.audit.application.*;
import com.transportplatform.tms.features.billing.application.FinancialRequestService;
import com.transportplatform.tms.features.driverportal.application.DriverPortalAccessService;
import com.transportplatform.tms.features.settings.application.TenantTimeService;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.sql.Statement;
import java.time.LocalDate;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DriverPayoutService {
    public record PayoutRequest(@NotNull Long driverId,@NotNull @DecimalMin("0.01") @Digits(integer=10,fraction=2) BigDecimal amount,
            @NotNull LocalDate paidOn,@NotBlank @Size(max=150) String reference,@Size(max=2000) String notes) {}
    public record Reversal(@NotBlank @Size(max=2000) String reason) {}
    public record Payout(long id,long driverId,BigDecimal amount,LocalDate paidOn,String reference,String notes,boolean reversed,String reversalReason) {}
    public record Account(BigDecimal approvedEarnings,BigDecimal paidAmount,BigDecimal outstanding,String currency,List<Payout> payouts) {}
    private final JdbcTemplate db; private final CurrentAuthenticatedUserService users; private final FinancialRequestService requests;
    private final DriverPortalAccessService driverAccess; private final TenantTimeService time; private final AuditLogService audit; private final PhiCipher privacy;
    public DriverPayoutService(JdbcTemplate db,CurrentAuthenticatedUserService users,FinancialRequestService requests,
            DriverPortalAccessService driverAccess,TenantTimeService time,AuditLogService audit,PhiCipher privacy) {
        this.db=db;this.users=users;this.requests=requests;this.driverAccess=driverAccess;this.time=time;this.audit=audit;this.privacy=privacy;
    }
    private String tenant() {
        var user=users.requireCurrentUser();
        if(user.tenantId()==null || user.getAuthorities().stream().noneMatch(a->a.getAuthority().equals("ROLE_TENANT_ADMIN")))
            throw new ApiException(ErrorCode.FORBIDDEN,HttpStatus.FORBIDDEN,"A tenant administrator is required.");
        return user.tenantId();
    }
    @Transactional(readOnly=true) public Account account(long driver) { return account(tenant(),driver); }
    @Transactional(readOnly=true) public Account mine() { var driver=driverAccess.resolveCurrentDriver();return account(driver.getTenantId(),driver.getId()); }
    private Account account(String tenant,long driver) {
        if(db.queryForObject("SELECT COUNT(*) FROM drivers WHERE tenant_id=? AND id=?",Long.class,tenant,driver)!=1) throw invalid("Driver was not found.");
        BigDecimal approved=db.queryForObject("SELECT COALESCE(SUM(amount),0) FROM driver_earnings_ledger WHERE tenant_id=? AND driver_id=? AND status='APPROVED'",BigDecimal.class,tenant,driver);
        BigDecimal paid=db.queryForObject("SELECT COALESCE(SUM(amount),0) FROM driver_payouts WHERE tenant_id=? AND driver_id=? AND reversed_at IS NULL",BigDecimal.class,tenant,driver);
        var payouts=db.query("SELECT * FROM driver_payouts WHERE tenant_id=? AND driver_id=? ORDER BY id DESC",(r,n)->new Payout(r.getLong("id"),r.getLong("driver_id"),r.getBigDecimal("amount"),r.getDate("paid_on").toLocalDate(),r.getString("reference"),privacy.decrypt(r.getString("notes"),"text"),r.getTimestamp("reversed_at")!=null,privacy.decrypt(r.getString("reversal_reason"),"text")),tenant,driver);
        return new Account(approved,paid,approved.subtract(paid),"USD",payouts);
    }
    @Transactional(isolation=org.springframework.transaction.annotation.Isolation.READ_COMMITTED) public Account record(PayoutRequest request,String key) {
        String tenant=tenant();
        long id=requests.execute(tenant,key,"DRIVER_PAYOUT",request,()->{
            var current=account(tenant,request.driverId());
            if(request.amount().signum()<=0 || request.amount().scale()>2 || request.amount().compareTo(current.outstanding())>0)
                throw invalid("Payout must be positive and cannot exceed approved unpaid earnings.");
            if(request.paidOn().isAfter(time.today(tenant))) throw invalid("Payout date cannot be in the future.");
            var holder=new GeneratedKeyHolder();
            db.update(c->{var p=c.prepareStatement("INSERT INTO driver_payouts(tenant_id,driver_id,amount,paid_on,reference,notes,created_by) VALUES(?,?,?,?,?,?,?)",Statement.RETURN_GENERATED_KEYS);
                p.setString(1,tenant);p.setLong(2,request.driverId());p.setBigDecimal(3,request.amount());p.setObject(4,request.paidOn());p.setString(5,request.reference().trim());p.setString(6,privacy.encrypt(request.notes(),"text"));p.setLong(7,users.requireCurrentUser().id());return p;},holder);
            long payout=Objects.requireNonNull(holder.getKey()).longValue();
            BigDecimal remaining=request.amount();
            var entries=db.queryForList("SELECT e.id,e.amount-COALESCE((SELECT SUM(a.amount) FROM driver_payout_allocations a JOIN driver_payouts p ON p.id=a.payout_id WHERE a.ledger_id=e.id AND p.reversed_at IS NULL),0) AS available FROM driver_earnings_ledger e WHERE e.tenant_id=? AND e.driver_id=? AND e.status='APPROVED' AND e.amount>0 ORDER BY e.id",tenant,request.driverId());
            for(var entry:entries) {
                if(remaining.signum()==0) break;
                BigDecimal available=(BigDecimal)entry.get("available"); if(available.signum()<=0) continue;
                BigDecimal allocated=available.min(remaining);
                db.update("INSERT INTO driver_payout_allocations(tenant_id,payout_id,ledger_id,amount) VALUES(?,?,?,?)",tenant,payout,entry.get("id"),allocated);remaining=remaining.subtract(allocated);
            }
            if(remaining.signum()!=0) throw invalid("Approved earnings changed. Reconcile the driver account before paying.");
            recordAudit(tenant,"PAYOUT_RECORDED",payout,request.amount());return payout;
        });
        Long driver=db.queryForObject("SELECT driver_id FROM driver_payouts WHERE tenant_id=? AND id=?",Long.class,tenant,id);
        return account(tenant,driver);
    }
    @Transactional(isolation=org.springframework.transaction.annotation.Isolation.READ_COMMITTED) public Account reverse(long id,Reversal request,String key) {
        String tenant=tenant();
        requests.execute(tenant,key,"PAYOUT_REVERSAL",List.of(id,request),()->{
            var rows=db.queryForList("SELECT amount,reversed_at FROM driver_payouts WHERE tenant_id=? AND id=?",tenant,id);
            if(rows.isEmpty() || rows.getFirst().get("reversed_at")!=null) throw invalid("Only an unreversed payout can be reversed.");
            db.update("UPDATE driver_payouts SET reversed_at=UTC_TIMESTAMP(6),reversal_reason=? WHERE tenant_id=? AND id=?",privacy.encrypt(request.reason().trim(),"text"),tenant,id);
            recordAudit(tenant,"PAYOUT_REVERSED",id,(BigDecimal)rows.getFirst().get("amount"));return id;
        });
        return account(tenant,db.queryForObject("SELECT driver_id FROM driver_payouts WHERE tenant_id=? AND id=?",Long.class,tenant,id));
    }
    private void recordAudit(String tenant,String action,long id,BigDecimal amount) { audit.record(new AuditLogCommand(null,tenant,"DRIVER_EARNINGS",action,"DRIVER_PAYOUT",Long.toString(id),"Manual driver payout ledger updated.",null,Map.of("amount",amount,"currency","USD"))); }
    private ApiException invalid(String message) { return new ApiException(ErrorCode.RESOURCE_CONFLICT,HttpStatus.CONFLICT,message); }
}
