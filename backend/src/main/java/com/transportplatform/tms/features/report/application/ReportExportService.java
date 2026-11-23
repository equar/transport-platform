package com.transportplatform.tms.features.report.application;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.transportplatform.tms.common.exception.*;
import com.transportplatform.tms.common.security.*;
import com.transportplatform.tms.features.auth.domain.*;
import com.transportplatform.tms.features.tenant.domain.*;
import com.transportplatform.tms.features.report.domain.ReportType;
import com.transportplatform.tms.features.report.api.response.CompanyReportResponse;
import com.transportplatform.tms.features.driver.domain.*;
import com.transportplatform.tms.features.vehicle.domain.*;
import com.transportplatform.tms.features.rider.domain.*;
import com.transportplatform.tms.features.ride.domain.*;
import com.transportplatform.tms.features.route.domain.*;
import com.transportplatform.tms.features.organization.domain.ServiceType;
import com.transportplatform.tms.features.billing.domain.*;
import com.transportplatform.tms.features.compliance.domain.*;
import com.transportplatform.tms.features.incident.domain.*;
import java.time.*;
import java.sql.Timestamp;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

@Service
public class ReportExportService {
    @org.springframework.beans.factory.annotation.Autowired
    private com.transportplatform.tms.features.saas.application.TenantEntitlementService entitlements;
    @org.springframework.beans.factory.annotation.Autowired private com.transportplatform.tms.common.privacy.PhiCipher privacy;
    public record Request(ReportType reportType, Map<String,String> filters) {}
    public record Job(String id, String status, int progress, String error, Instant expiresAt) {}
    private final JdbcTemplate jdbc;
    private final ObjectMapper mapper;
    private final CurrentAuthenticatedUserService current;
    private final AppUserRepository users;
    private final TenantRepository tenants;
    private final ReportService reports;
    private final Clock clock;
    public ReportExportService(JdbcTemplate jdbc,ObjectMapper mapper,CurrentAuthenticatedUserService current,
            AppUserRepository users,TenantRepository tenants,ReportService reports,Clock clock) {
        this.jdbc=jdbc;this.mapper=mapper;this.current=current;this.users=users;this.tenants=tenants;this.reports=reports;this.clock=clock;
    }
    @org.springframework.beans.factory.annotation.Autowired private ReportAccessService access;
    @org.springframework.beans.factory.annotation.Autowired private com.transportplatform.tms.common.concurrency.WorkflowLockService locks;

    @org.springframework.transaction.annotation.Transactional
    public Job create(Request request) {
        var owner=current.requireCurrentUser();
        if(request.reportType()==null || request.filters()==null) throw invalid("Choose a report and a date range.");
        LocalDate from=date(request.filters(),"fromDate"), to=date(request.filters(),"toDate");
        if(from==null || to==null || to.isBefore(from) || from.plusDays(366).isBefore(to)) throw invalid("Choose a date range of up to 366 days.");
        access.requireReport(request.reportType());
        validateFilters(request);
        locks.lock(owner.tenantId(), "REPORT_EXPORT", owner.id());
        Long pending=jdbc.queryForObject("SELECT COUNT(*) FROM report_export_jobs WHERE tenant_id=? AND user_id=? AND status IN ('PENDING','RUNNING')",Long.class,owner.tenantId(),owner.id());
        if(pending!=null && pending>=3) throw invalid("Wait for an existing export or cancel it before starting another.");
        String id=UUID.randomUUID().toString();
        try { jdbc.update("INSERT INTO report_export_jobs(id,tenant_id,user_id,request_json,expires_at) VALUES (?,?,?,?,?)", id,owner.tenantId(),owner.id(),privacy.encrypt(mapper.writeValueAsString(request),"text"),Timestamp.from(clock.instant().plusSeconds(86400))); }
        catch(com.fasterxml.jackson.core.JsonProcessingException ex) { throw invalid("Export request could not be read."); }
        return status(id);
    }
    private static void validateFilters(Request request) {
        var f = request.filters();
        if (f.size() > 24 || f.entrySet().stream().anyMatch(entry -> entry.getKey().length() > 64 || (entry.getValue() != null && entry.getValue().length() > 200)))
            throw invalid("Export filters are too long. Shorten the search and try again.");
        for (String field : List.of("organizationId", "riderId", "driverId", "assignedToUserId")) number(f, field);
        for (String field : List.of("wheelchairRequired", "escortRequired", "overdueOnly", "expiredOnly", "expiringSoonOnly")) bool(f, field);
        switch (request.reportType()) {
            case DRIVER -> { en(DriverStatus.class,f,"status"); en(DriverType.class,f,"driverType"); }
            case VEHICLE -> { en(VehicleStatus.class,f,"status"); en(VehicleOwnershipType.class,f,"ownershipType"); }
            case RIDER -> { en(RiderStatus.class,f,"status"); en(RiderType.class,f,"riderType"); }
            case RIDE -> en(RideStatus.class,f,"status");
            case ROUTE -> en(RouteStatus.class,f,"status");
            case INVOICE -> { en(InvoiceStatus.class,f,"status"); en(BillToType.class,f,"billToType"); }
            case PAYMENT -> { en(PaymentStatus.class,f,"status"); en(PaymentMethod.class,f,"paymentMethod"); }
            case COMPLIANCE -> { en(ComplianceEntityType.class,f,"entityType"); en(ComplianceIssueType.class,f,"issueType"); en(ComplianceIssueSeverity.class,f,"severity"); en(ComplianceIssueStatus.class,f,"issueStatus"); }
            case INCIDENT -> { en(IncidentType.class,f,"incidentType"); en(IncidentSeverity.class,f,"severity"); en(IncidentStatus.class,f,"status"); }
        }
        if (request.reportType() == ReportType.RIDE || request.reportType() == ReportType.ROUTE) en(ServiceType.class,f,"serviceType");
    }
    private Map<String,Object> owned(String id) {
        var owner=current.requireCurrentUser();
        access.requireReportUser();
        var rows=jdbc.queryForList("SELECT id,status,progress,error_message,expires_at FROM report_export_jobs WHERE id=? AND tenant_id=? AND user_id=? AND expires_at>?",id,owner.tenantId(),owner.id(),Timestamp.from(clock.instant()));
        if(rows.isEmpty()) throw new ApiException(ErrorCode.RESOURCE_NOT_FOUND,HttpStatus.NOT_FOUND,"Export not found or expired.");
        String payload=jdbc.queryForObject("SELECT request_json FROM report_export_jobs WHERE id=? AND tenant_id=? AND user_id=?",String.class,id,owner.tenantId(),owner.id());
        try { access.requireReport(mapper.readValue(privacy.decrypt(payload,"text"),Request.class).reportType()); }
        catch(com.fasterxml.jackson.core.JsonProcessingException ex) { throw invalid("Export request could not be read."); }
        return rows.getFirst();
    }
    public Job status(String id) { var r=owned(id);return new Job(id,(String)r.get("status"),((Number)r.get("progress")).intValue(),(String)r.get("error_message"),((Timestamp)r.get("expires_at")).toInstant()); }
    public void cancel(String id) { owned(id);jdbc.update("UPDATE report_export_jobs SET status='CANCELLED',result_csv=NULL WHERE id=? AND status IN ('PENDING','RUNNING')",id); }
    public String download(String id) {
        var r=owned(id); if(!"COMPLETED".equals(r.get("status"))) throw invalid("The export is not ready.");
        return privacy.decrypt(jdbc.queryForObject("SELECT result_csv FROM report_export_jobs WHERE id=?",String.class,id),"text");
    }
    @Scheduled(fixedDelayString="${app.report-export.fixed-delay:PT15S}")
    public void runDue() {
        jdbc.update("DELETE FROM report_export_jobs WHERE expires_at<?",Timestamp.from(clock.instant()));
        var rows=jdbc.queryForList("SELECT * FROM report_export_jobs WHERE expires_at>? AND (status='PENDING' OR (status='RUNNING' AND lease_until<?)) ORDER BY created_at LIMIT 1",Timestamp.from(clock.instant()),Timestamp.from(clock.instant()));
        for(var row:rows) {
            String id=(String)row.get("id");
            int claimed=jdbc.update("UPDATE report_export_jobs SET status='RUNNING',progress=0,lease_until=? WHERE id=? AND (status='PENDING' OR (status='RUNNING' AND lease_until<?))",Timestamp.from(clock.instant().plusSeconds(300)),id,Timestamp.from(clock.instant()));
            if(claimed==0) continue;
            var previous=SecurityContextHolder.getContext();
            try {
                authenticate(row);
                Request request=mapper.readValue(privacy.decrypt((String)row.get("request_json"),"text"),Request.class);
                access.requireReport(request.reportType());
                String table = switch(request.reportType()) {
                    case DRIVER -> "drivers"; case VEHICLE -> "vehicles"; case RIDER -> "riders"; case RIDE -> "rides";
                    case ROUTE -> "routes"; case INVOICE -> "invoices"; case PAYMENT -> "payments";
                    case COMPLIANCE -> "compliance_issues"; case INCIDENT -> "incidents";
                };
                Long upperId = jdbc.queryForObject("SELECT COALESCE(MAX(id),0) FROM " + table + " WHERE tenant_id=?", Long.class, row.get("tenant_id"));
                var filters=new HashMap<>(request.filters());
                LocalDate from=date(filters,"fromDate"),to=date(filters,"toDate");
                StringBuilder csv=new StringBuilder(); boolean header=false;int records=0;
                long days=java.time.temporal.ChronoUnit.DAYS.between(from,to)+1;
                for(LocalDate day=from;!day.isAfter(to);day=day.plusDays(1)) {
                    if(!"RUNNING".equals(jdbc.queryForObject("SELECT status FROM report_export_jobs WHERE id=?",String.class,id))) break;
                    authenticate(row); // Recheck role, user and tenant for every partition.
                    filters.put("fromDate",day.toString());filters.put("toDate",day.toString());
                    long afterId = 0;
                    while (true) {
                        authenticate(row);
                        if (!"RUNNING".equals(jdbc.queryForObject("SELECT status FROM report_export_jobs WHERE id=?",String.class,id))) break;
                        long cursor = afterId;
                        CompanyReportResponse<?> report=ReportQueryLimits.exportPage(cursor, upperId == null ? 0 : upperId, () -> run(request.reportType(),filters));
                        for(Object record:report.rows()) {
                            @SuppressWarnings("unchecked") Map<String,Object> values=mapper.convertValue(record,LinkedHashMap.class);
                            Object rowId = values.get("id");
                            if (!(rowId instanceof Number number) || number.longValue() <= afterId) throw new IllegalStateException("Invalid export cursor");
                            afterId = number.longValue();
                            if(!header) { append(csv,values.keySet());header=true; }
                            append(csv,values.values());
                            if(++records>100000 || csv.length()>4000000) throw invalid("Export is too large. Choose a shorter date range.");
                        }
                        jdbc.update("UPDATE report_export_jobs SET lease_until=? WHERE id=? AND status='RUNNING'",Timestamp.from(clock.instant().plusSeconds(300)),id);
                        if (report.rows().size() < ReportQueryLimits.EXPORT_PAGE_SIZE) break;
                    }
                    int progress=(int)(100*(java.time.temporal.ChronoUnit.DAYS.between(from,day)+1)/days);
                    jdbc.update("UPDATE report_export_jobs SET progress=?,lease_until=? WHERE id=? AND status='RUNNING'",progress,Timestamp.from(clock.instant().plusSeconds(300)),id);
                }
                jdbc.update("UPDATE report_export_jobs SET status='COMPLETED',progress=100,result_csv=?,lease_until=NULL WHERE id=? AND status='RUNNING'",privacy.encrypt(csv.toString(),"text"),id);
            } catch(Exception ex) {
                jdbc.update("UPDATE report_export_jobs SET status='FAILED',error_message=?,lease_until=NULL WHERE id=? AND status='RUNNING'",ex instanceof ApiException ? ex.getMessage() : "Export failed. Please retry or contact support.",id);
            } finally { SecurityContextHolder.setContext(previous); }
        }
    }
    private void authenticate(Map<String,Object> row) {
        var user=users.findById(((Number)row.get("user_id")).longValue()).orElseThrow(() -> invalid("Export owner unavailable."));
        String tenant=(String)row.get("tenant_id");
        entitlements.requireOperational(tenant);
        if(!user.isActiveForLogin() || !Objects.equals(tenant,user.getTenantId()) || user.getRoles().stream().noneMatch(r -> Set.of(RoleName.ROLE_TENANT_ADMIN,RoleName.ROLE_BILLING_ADMIN,RoleName.ROLE_COMPLIANCE_ADMIN).contains(r))
            || tenants.findById(tenant).map(t->t.getStatus()!=TenantStatus.ACTIVE).orElse(true)) throw invalid("Export access is no longer available.");
        var authorities=user.getRoles().stream().map(role->new SimpleGrantedAuthority(role.name())).toList();
        var principal=new AuthenticatedUser(user.getId(),tenant,user.getEmail(),user.getFirstName(),user.getLastName(),"",true,true,user.isMustChangePassword(),authorities);
        var context=SecurityContextHolder.createEmptyContext();context.setAuthentication(new UsernamePasswordAuthenticationToken(principal,null,authorities));SecurityContextHolder.setContext(context);
    }
    private CompanyReportResponse<?> run(ReportType type,Map<String,String> f) {
        String k=f.getOrDefault("keyword","");LocalDate a=date(f,"fromDate"),b=date(f,"toDate");
        return switch(type) {
            case DRIVER -> reports.runDriverReport(k,en(DriverStatus.class,f,"status"),en(DriverType.class,f,"driverType"),a,b);
            case VEHICLE -> reports.runVehicleReport(k,en(VehicleStatus.class,f,"status"),en(VehicleOwnershipType.class,f,"ownershipType"),f.get("serviceType"),a,b);
            case RIDER -> reports.runRiderReport(k,en(RiderStatus.class,f,"status"),en(RiderType.class,f,"riderType"),number(f,"organizationId"),bool(f,"wheelchairRequired"),bool(f,"escortRequired"),a,b);
            case RIDE -> reports.runRideReport(k,en(RideStatus.class,f,"status"),en(ServiceType.class,f,"serviceType"),number(f,"riderId"),number(f,"organizationId"),a,b);
            case ROUTE -> reports.runRouteReport(k,en(RouteStatus.class,f,"status"),en(ServiceType.class,f,"serviceType"),number(f,"driverId"),a,b);
            case INVOICE -> reports.runInvoiceReport(k,en(InvoiceStatus.class,f,"status"),en(BillToType.class,f,"billToType"),a,b,bool(f,"overdueOnly"));
            case PAYMENT -> reports.runPaymentReport(k,en(PaymentStatus.class,f,"status"),en(PaymentMethod.class,f,"paymentMethod"),a,b);
            case COMPLIANCE -> reports.runComplianceReport(k,en(ComplianceEntityType.class,f,"entityType"),en(ComplianceIssueType.class,f,"issueType"),en(ComplianceIssueSeverity.class,f,"severity"),en(ComplianceIssueStatus.class,f,"issueStatus"),bool(f,"expiredOnly"),bool(f,"expiringSoonOnly"),a,b);
            case INCIDENT -> reports.runIncidentReport(k,en(IncidentType.class,f,"incidentType"),en(IncidentSeverity.class,f,"severity"),en(IncidentStatus.class,f,"status"),number(f,"assignedToUserId"),a,b);
        };
    }
    private static void append(StringBuilder out,Collection<?> values) {
        out.append(values.stream().map(v->{String s=v==null?"":v.toString();if(!s.stripLeading().isEmpty() && "=+-@".indexOf(s.stripLeading().charAt(0))>=0)s="'"+s;return "\""+s.replace("\"","\"\"")+"\"";}).collect(java.util.stream.Collectors.joining(","))).append("\r\n");
    }
    private static LocalDate date(Map<String,String> f,String k) {String v=f.get(k);return v==null||v.isBlank()?null:parseDate(v,k);}
    private static Long number(Map<String,String> f,String k) {String v=f.get(k);return v==null||v.isBlank()?null:parseNumber(v,k);}
    private static Boolean bool(Map<String,String> f,String k) {String v=f.get(k);return v==null||v.isBlank()?null:parseBoolean(v,k);}
    private static <T extends Enum<T>> T en(Class<T> type,Map<String,String> f,String k) {String v=f.get(k);return v==null||v.isBlank()?null:parseEnum(type,v,k);}
    private static ApiException fieldError(String field, String message) {
        return new ApiException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST,
                "Review the export filters and try again.", Map.of("fieldErrors", Map.of(field, message)));
    }
    private static LocalDate parseDate(String value, String field) {
        try { if (!value.matches("[0-9]{4}-[0-9]{2}-[0-9]{2}")) throw new java.time.DateTimeException("Invalid date format"); return LocalDate.parse(value); } catch (java.time.DateTimeException ex) {
            throw fieldError(field, "Enter a valid date in YYYY-MM-DD format.");
        }
    }
    private static Long parseNumber(String value, String field) {
        try { long result = Long.parseLong(value); if (result <= 0) throw new NumberFormatException(); return result; }
        catch (NumberFormatException ex) { throw fieldError(field, "Choose a valid record."); }
    }
    private static Boolean parseBoolean(String value, String field) {
        if (!value.equals("true") && !value.equals("false")) throw fieldError(field, "Choose true or false.");
        return Boolean.valueOf(value);
    }
    private static <T extends Enum<T>> T parseEnum(Class<T> type, String value, String field) {
        try { return Enum.valueOf(type, value); } catch (IllegalArgumentException ex) {
            throw fieldError(field, "Choose a supported value.");
        }
    }
    private static ApiException invalid(String message) {return new ApiException(ErrorCode.VALIDATION_FAILED,HttpStatus.BAD_REQUEST,message);}
}
