package com.transportplatform.tms.common.concurrency;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;

/** Domain locks must never share the dispatch tenant row. Caller owns the transaction. */
@Service
public class WorkflowLockService {
    private final JdbcTemplate db;
    public WorkflowLockService(JdbcTemplate db) { this.db = db; }
    @Transactional(propagation = Propagation.MANDATORY)
    public void lock(String tenant, String workflow, long subject) {
        db.update("INSERT INTO workflow_locks(tenant_id,workflow,subject_id) VALUES(?,?,?) ON DUPLICATE KEY UPDATE subject_id=workflow_locks.subject_id", tenant, workflow, subject);
        db.queryForList("SELECT tenant_id FROM workflow_locks WHERE tenant_id=? AND workflow=? AND subject_id=? FOR UPDATE", tenant, workflow, subject);
    }
}
