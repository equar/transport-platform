package com.transportplatform.tms.features.riderguardianportal.application;
import com.transportplatform.tms.common.security.CurrentAuthenticatedUserService;
import com.transportplatform.tms.common.exception.*;
import com.transportplatform.tms.features.riderguardianportal.api.request.RiderGuardianPortalRideCreateRequest;
import com.transportplatform.tms.features.riderguardianportal.api.response.RiderGuardianPortalRideDetailResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.HttpStatus;
import java.security.MessageDigest;
import java.util.HexFormat;
@Service
public class PortalBookingIdempotencyService {
    private final JdbcTemplate jdbc;private final CurrentAuthenticatedUserService current;private final ObjectMapper mapper;private final RiderGuardianPortalService portal;
    public PortalBookingIdempotencyService(JdbcTemplate jdbc,CurrentAuthenticatedUserService current,ObjectMapper mapper,RiderGuardianPortalService portal) {this.jdbc=jdbc;this.current=current;this.mapper=mapper;this.portal=portal;}
    @Transactional
    public RiderGuardianPortalRideDetailResponse create(RiderGuardianPortalRideCreateRequest request,String key) {
        if(key==null || key.isBlank()) return portal.createRide(request);
        if(key.length()>120) throw new ApiException(ErrorCode.VALIDATION_FAILED,HttpStatus.BAD_REQUEST,"Idempotency key is too long.");
        var owner=current.requireCurrentUser();String hash;
        try { hash=HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(mapper.writeValueAsBytes(request))); }
        catch(Exception ex) {throw new IllegalStateException("Cannot fingerprint booking request",ex);}
        jdbc.update("INSERT INTO portal_booking_requests(tenant_id,user_id,idempotency_key,request_hash) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE idempotency_key=idempotency_key",owner.tenantId(),owner.id(),key,hash);
        var row=jdbc.queryForMap("SELECT request_hash,ride_id FROM portal_booking_requests WHERE tenant_id=? AND user_id=? AND idempotency_key=? FOR UPDATE",owner.tenantId(),owner.id(),key);
        if(!hash.equals(row.get("request_hash"))) throw new ApiException(ErrorCode.RESOURCE_CONFLICT,HttpStatus.CONFLICT,"This booking key was used for different details. Review and submit a new request.");
        if(row.get("ride_id")!=null) return portal.getRide(((Number)row.get("ride_id")).longValue());
        var ride=portal.createRide(request);
        jdbc.update("UPDATE portal_booking_requests SET ride_id=? WHERE tenant_id=? AND user_id=? AND idempotency_key=?",ride.id(),owner.tenantId(),owner.id(),key);
        return ride;
    }
}
