package com.transportplatform.tms.features.billing.application;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.transportplatform.tms.common.concurrency.WorkflowLockService;
import com.transportplatform.tms.common.exception.*;
import java.security.MessageDigest;
import java.util.*;
import java.util.function.LongSupplier;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;

@Service
public class FinancialRequestService {
    private final JdbcTemplate db; private final ObjectMapper json; private final WorkflowLockService locks;
    public FinancialRequestService(JdbcTemplate db,ObjectMapper json,WorkflowLockService locks) { this.db=db;this.json=json;this.locks=locks; }
    @Transactional(propagation=Propagation.MANDATORY)
    public long execute(String tenant,String key,String operation,Object request,LongSupplier action) {
        if(key==null || !key.matches("[A-Za-z0-9._:-]{1,120}"))
            throw new ApiException(ErrorCode.VALIDATION_FAILED,HttpStatus.BAD_REQUEST,"A valid Idempotency-Key is required.");
        locks.lock(tenant,"FINANCE",0);
        String hash;
        try { hash=HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(json.writeValueAsBytes(List.of(operation,request)))); }
        catch(Exception ex) { throw new IllegalStateException("Financial request encoding failed.",ex); }
        var existing=db.queryForList("SELECT operation,request_hash,result_id FROM billing_adjustment_intents WHERE tenant_id=? AND request_key=?",tenant,key);
        if(!existing.isEmpty()) {
            var row=existing.getFirst();
            if(!operation.equals(row.get("operation")) || !hash.equals(row.get("request_hash")))
                throw new ApiException(ErrorCode.RESOURCE_CONFLICT,HttpStatus.CONFLICT,"This retry key belongs to a different financial request.");
            return ((Number)row.get("result_id")).longValue();
        }
        long id=action.getAsLong();
        db.update("INSERT INTO billing_adjustment_intents(tenant_id,request_key,operation,request_hash,result_id) VALUES(?,?,?,?,?)",tenant,key,operation,hash,id);
        return id;
    }
}
