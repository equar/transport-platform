package com.transportplatform.tms.features.auth.application;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.transportplatform.tms.common.privacy.PhiCipher;
import com.transportplatform.tms.features.auth.domain.AppUser;
import com.transportplatform.tms.features.notification.application.NotificationEmailSender;
import java.sql.Timestamp;
import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.*;
import org.springframework.transaction.support.TransactionTemplate;

/** Recovery payloads are encrypted and committed atomically with the reset token. */
@Service
public class RecoveryEmailService {
    private final JdbcTemplate db;
    private final PhiCipher cipher;
    private final ObjectMapper mapper;
    private final NotificationEmailSender sender;
    private final Clock clock;
    private final TransactionTemplate transaction;
    public RecoveryEmailService(JdbcTemplate db,PhiCipher cipher,ObjectMapper mapper,NotificationEmailSender sender,Clock clock,PlatformTransactionManager manager) {
        this.db=db;this.cipher=cipher;this.mapper=mapper;this.sender=sender;this.clock=clock;this.transaction=new TransactionTemplate(manager);
    }
    @Transactional(propagation=Propagation.MANDATORY)
    public void enqueue(AppUser user,String link) {
        try {
            String payload=mapper.writeValueAsString(new NotificationEmailSender.NotificationEmailCommand(user.getEmail(),"Password reset request","Password reset request","A password reset was requested for your account. Use this link to continue: "+link));
            db.update("INSERT INTO recovery_email_jobs(user_id,token_hash,payload,next_attempt_at,expires_at) VALUES(?,?,?,?,?)",user.getId(),user.getPasswordResetTokenHash(),cipher.encrypt(payload,"recovery-email|"+user.getId()),utc(clock.instant()),utc(user.getPasswordResetTokenExpiresAt()));
        } catch (com.fasterxml.jackson.core.JsonProcessingException failure) { throw new IllegalStateException("Recovery instructions could not be queued."); }
    }
    @Scheduled(fixedDelayString="${app.recovery-email.delay:PT30S}")
    public void deliverDue() {
        var now=clock.instant();
        db.update("DELETE FROM recovery_email_jobs WHERE expires_at<=?",utc(now));
        var ids=db.queryForList("SELECT id FROM recovery_email_jobs WHERE status IN ('PENDING','SENDING') AND attempts<5 AND next_attempt_at<=? ORDER BY id LIMIT 25",Long.class,utc(now));
        for(long id:ids) {
            String claim=UUID.randomUUID().toString();
            Map<String,Object> job=transaction.execute(status->{
                int updated=db.update("UPDATE recovery_email_jobs SET status='SENDING',claim_token=?,attempts=attempts+1,next_attempt_at=? WHERE id=? AND status IN ('PENDING','SENDING') AND attempts<5 AND next_attempt_at<=?",claim,utc(now.plusSeconds(300)),id,utc(now));
                if(updated==0)return null;
                var row=db.queryForMap("SELECT * FROM recovery_email_jobs WHERE id=?",id);
                var valid=db.queryForList("SELECT id FROM app_users WHERE id=? AND password_reset_token_hash=? AND password_reset_token_expires_at>? AND status='ACTIVE' AND enabled=TRUE AND locked=FALSE",row.get("user_id"),row.get("token_hash"),utc(now));
                if(valid.isEmpty()){db.update("DELETE FROM recovery_email_jobs WHERE id=?",id);return null;}
                return row;
            });
            if(job==null)continue;
            boolean sent=false;
            try {
                var command=mapper.readValue(cipher.decrypt((String)job.get("payload"),"recovery-email|"+job.get("user_id")),NotificationEmailSender.NotificationEmailCommand.class);
                var result=sender.send(command);sent=result!=null&&result.sent();
            } catch(Exception failure) { /* Do not log credential-bearing provider errors. */ }
            int attempts=((Number)job.get("attempts")).intValue();
            if(sent) db.update("DELETE FROM recovery_email_jobs WHERE id=? AND claim_token=?",id,claim);
            else {
                db.update("UPDATE recovery_email_jobs SET status=?,claim_token=NULL,next_attempt_at=? WHERE id=? AND claim_token=?",attempts>=5?"FAILED":"PENDING",utc(clock.instant().plusSeconds(Math.min(900,60L*attempts*attempts))),id,claim);
                if(attempts>=5)org.slf4j.LoggerFactory.getLogger(getClass()).error("Recovery email exhausted retries jobId={}",id);
            }
        }
        db.update("UPDATE recovery_email_jobs SET status='FAILED',claim_token=NULL WHERE status='SENDING' AND attempts>=5 AND next_attempt_at<=?",utc(clock.instant()));
    }
    private static java.time.LocalDateTime utc(Instant instant) { return java.time.LocalDateTime.ofInstant(instant, java.time.ZoneOffset.UTC); }

}
