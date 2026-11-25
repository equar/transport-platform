package com.transportplatform.tms.features.billing.application;

import com.transportplatform.tms.common.exception.*;
import com.transportplatform.tms.features.billing.domain.*;
import com.transportplatform.tms.features.ride.domain.*;
import com.transportplatform.tms.features.route.domain.*;
import java.math.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

/** Called under the tenant finance lock. Claims and allocations commit with the invoice. */
@Service
public class BillingSourceService {
    private final JdbcTemplate db;
    private final BillingReferenceValidationService refs;
    public BillingSourceService(JdbcTemplate db, BillingReferenceValidationService refs) { this.db=db; this.refs=refs; }

    public void validate(Invoice invoice, List<InvoiceLineItem> lines) {
        String tenant=invoice.getTenantId();
        Set<Long> covered=new HashSet<>(), routeIds=new HashSet<>();
        for(var line:lines) {
            if(line.getPricingRuleId()!=null && db.queryForObject("SELECT COUNT(*) FROM pricing_rules WHERE tenant_id=? AND id=?",Long.class,tenant,line.getPricingRuleId())!=1)
                throw invalid("Pricing rule was not found for this company.");
            if(line.getChargeSourceType()==ChargeSourceType.RIDE) matches(invoice,refs.resolveRide(tenant,required(line)));
            if(line.getChargeSourceType()==ChargeSourceType.ROUTE) {
                var route=refs.resolveRoute(tenant,required(line));
                if(route.getStatus()!=RouteStatus.COMPLETED) throw invalid("Only completed routes can be billed.");
                if(!routeIds.add(route.getId())) throw invalid("A route may appear only once in an invoice.");
                if(route.getBillToId()!=null && (!Objects.equals(route.getBillToId(),invoice.getBillToId()) || route.getBillToType()!=invoice.getBillToType()))
                    throw invalid("Use the billing account selected on this route.");
            }
            if(line.getChargeSourceType()==ChargeSourceType.CONTRACT)
                refs.resolveBillTo(tenant,BillToType.CONTRACT,required(line));
            for(Long ride:coverage(tenant,line)) if(!covered.add(ride)) throw invalid("The same trip cannot be charged through both a route and an individual trip.");
        }
        if(covered.isEmpty() && routeIds.isEmpty()) return;
        var params=new HashMap<String,Object>();params.put("tenant",tenant);
        params.put("rides",covered.isEmpty()?List.of(-1L):covered);
        params.put("routes",routeIds.isEmpty()?List.of(-1L):routeIds);
        var excluded=lines.stream().map(InvoiceLineItem::getId).filter(Objects::nonNull).toList();
        params.put("excluded",excluded.isEmpty()?List.of(-1L):excluded);
        var conflicts=new NamedParameterJdbcTemplate(db).queryForList("""
            SELECT DISTINCT li.id FROM invoice_line_items li JOIN invoices i ON i.id=li.invoice_id AND i.tenant_id=li.tenant_id
            LEFT JOIN route_stops rs ON li.charge_source_type='ROUTE' AND rs.tenant_id=li.tenant_id AND rs.route_id=li.source_reference_id
            WHERE li.tenant_id=:tenant AND i.status<>'VOID' AND li.id NOT IN (:excluded)
            AND ((li.charge_source_type='RIDE' AND li.source_reference_id IN (:rides))
              OR (li.charge_source_type='ROUTE' AND (li.source_reference_id IN (:routes) OR rs.ride_id IN (:rides))))
            """ + (org.springframework.transaction.support.TransactionSynchronizationManager.isCurrentTransactionReadOnly() ? "" : " FOR UPDATE"),params);
        if(!conflicts.isEmpty()) throw invalid("This service is already included in a non-void route or trip invoice. Void the original charge before rebilling.");
    }

    public void requireDeliveredEvidence(Invoice invoice, List<InvoiceLineItem> lines) {
        for (var line : lines) for (Long ride : coverage(invoice.getTenantId(), line)) {
            if (refs.resolveRide(invoice.getTenantId(), ride).getStatus() == RideStatus.COMPLETED)
                refs.resolveBillableRide(invoice.getTenantId(), ride);
        }
    }

    public void sync(Invoice invoice, List<InvoiceLineItem> lines) {
        for(var line:lines) {
            if(line.getId()==null) continue;
            db.update("DELETE FROM invoice_route_claims WHERE tenant_id=? AND line_item_id=?",invoice.getTenantId(),line.getId());
            if (line.getChargeSourceType()==ChargeSourceType.ROUTE && invoice.getStatus()!=InvoiceStatus.VOID)
                db.update("INSERT INTO invoice_route_claims(tenant_id,route_id,line_item_id) VALUES(?,?,?)",invoice.getTenantId(),line.getSourceReferenceId(),line.getId());
            db.update("DELETE FROM invoice_ride_allocations WHERE tenant_id=? AND line_item_id=?",invoice.getTenantId(),line.getId());
            var rides=coverage(invoice.getTenantId(),line).stream().sorted().toList();
            var eligible=rides.stream().filter(id -> refs.resolveRide(invoice.getTenantId(),id).getStatus()==RideStatus.COMPLETED).toList();
            var cents=line.getLineAmount().setScale(2,RoundingMode.HALF_UP).movePointRight(2).toBigIntegerExact();
            var count=BigInteger.valueOf(Math.max(eligible.size(),1));
            int index=0;
            for(Long ride:rides) {
                BigDecimal amount=BigDecimal.ZERO.setScale(2);
                if(eligible.contains(ride)) {
                    var share=cents.divide(count);
                    if(index++<cents.remainder(count).intValueExact()) share=share.add(BigInteger.ONE);
                    amount=new BigDecimal(share,2);
                }
                db.update("INSERT INTO invoice_ride_allocations(tenant_id,invoice_id,line_item_id,ride_id,amount,claim_active) VALUES(?,?,?,?,?,?)",
                        invoice.getTenantId(),invoice.getId(),line.getId(),ride,amount,invoice.getStatus()!=InvoiceStatus.VOID);
            }
        }
    }

    public List<Long> invoiceRideIds(String tenant, Long invoice) {
        return db.queryForList("SELECT DISTINCT ride_id FROM invoice_ride_allocations WHERE tenant_id=? AND invoice_id=?",Long.class,tenant,invoice);
    }
    private List<Long> coverage(String tenant,InvoiceLineItem line) {
        if(line.getChargeSourceType()==ChargeSourceType.RIDE) return List.of(required(line));
        if(line.getChargeSourceType()==ChargeSourceType.ROUTE)
            return db.queryForList("SELECT DISTINCT ride_id FROM route_stops WHERE tenant_id=? AND route_id=? ORDER BY ride_id",Long.class,tenant,required(line));
        return List.of();
    }
    private Long required(InvoiceLineItem line) { if(line.getSourceReferenceId()==null) throw invalid("Select a valid service reference for this charge."); return line.getSourceReferenceId(); }
    private void matches(Invoice invoice,Ride ride) {
        boolean match=switch(invoice.getBillToType()) {
            case RIDER -> ride.getRider()!=null && ride.getRider().getId().equals(invoice.getBillToId());
            case GUARDIAN -> ride.getGuardian()!=null && ride.getGuardian().getId().equals(invoice.getBillToId());
            case ORGANIZATION -> ride.getOrganization()!=null && ride.getOrganization().getId().equals(invoice.getBillToId());
            case CONTRACT -> ride.getContract()!=null && ride.getContract().getId().equals(invoice.getBillToId());
        };
        if(!match) throw invalid("Selected trips must belong to the invoice billing account.");
    }
    private ApiException invalid(String message) { return new ApiException(ErrorCode.RESOURCE_CONFLICT,HttpStatus.CONFLICT,message); }
}
