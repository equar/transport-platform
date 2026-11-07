package com.transportplatform.tms.features.notification.application;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.transportplatform.tms.features.notification.domain.*;
import java.sql.Timestamp;
import java.time.Clock;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.PlatformTransactionManager;

/** Persisted per-device delivery. Only committed notification jobs are visible to this worker. */
@Service
public class PushDeliveryWorker {
    private final JdbcTemplate jdbc;
    private final NotificationRepository notifications;
    private final PortalPushDeviceTokenRepository tokens;
    private final NotificationPushSender sender;
    private final PortalPushDeviceTokenService tokenService;
    private final ObjectMapper mapper;
    private final Clock clock;
    private final TransactionTemplate transaction;
    private final NotificationDeliveryAccess deliveryAccess;
    public PushDeliveryWorker(JdbcTemplate jdbc, NotificationRepository notifications,
            PortalPushDeviceTokenRepository tokens, NotificationPushSender sender,
            PortalPushDeviceTokenService tokenService, ObjectMapper mapper, Clock clock,
            PlatformTransactionManager manager, NotificationDeliveryAccess deliveryAccess) {
        this.jdbc=jdbc; this.notifications=notifications; this.tokens=tokens; this.sender=sender;
        this.tokenService=tokenService; this.mapper=mapper; this.clock=clock;
        this.transaction=new TransactionTemplate(manager); this.deliveryAccess=deliveryAccess;
    }
    public void enqueue(Notification notification, PortalPushDeviceToken token) {
        jdbc.update("INSERT INTO push_delivery_jobs(notification_id,device_token_id) VALUES (?,?)", notification.getId(), token.getId());
    }
    @Scheduled(fixedDelayString="${app.push-delivery.fixed-delay:PT15S}")
    public void deliverDue() {
        // Claim each row independently. A lease permits recovery after a process crash.
        jdbc.update("UPDATE push_delivery_jobs SET status='FAILED',next_attempt_at=NULL,error_message='Delivery interrupted after final attempt.' WHERE status='SENDING' AND attempts>=5 AND next_attempt_at<=?",Timestamp.from(clock.instant()));
        var ids=jdbc.queryForList("SELECT id FROM push_delivery_jobs WHERE attempts < 5 AND next_attempt_at <= ? AND status IN ('PENDING','FAILED','SENDING') ORDER BY id LIMIT 50", Long.class, Timestamp.from(clock.instant()));
        for (Long id: ids) {
            var job=transaction.execute(status -> {
                var rows=jdbc.queryForList("SELECT * FROM push_delivery_jobs WHERE id=? AND next_attempt_at <= ? FOR UPDATE SKIP LOCKED", id, Timestamp.from(clock.instant()));
                if(rows.isEmpty()) return null;
                var row=rows.getFirst();
                jdbc.update("UPDATE push_delivery_jobs SET status='SENDING', attempts=attempts+1, next_attempt_at=? WHERE id=?", Timestamp.from(clock.instant().plusSeconds(120)), id);
                return row;
            });
            if(job==null) continue;
            var notification=notifications.findById(((Number)job.get("notification_id")).longValue());
            var token=tokens.findById(((Number)job.get("device_token_id")).longValue());
            boolean sent=false; String error=null; String receiptId=null;
            if(notification.isEmpty() || token.isEmpty() || token.get().getStatus()!=PortalPushDeviceTokenStatus.ACTIVE
                    || !java.util.Objects.equals(notification.get().getTenantId(),token.get().getTenantId())
                    || !java.util.Objects.equals(notification.get().getRecipientUserId(),token.get().getAppUserId())
                    || deliveryAccess.recipient(notification.get()).isEmpty()) {
                jdbc.update("UPDATE push_delivery_jobs SET status='SKIPPED', next_attempt_at=NULL WHERE id=?",id);
                continue;
            }
            try {
                var n=notification.get();
                Map<String,Object> data=n.getMetadataJson()==null ? Map.of() : mapper.readValue(n.getMetadataJson(),new TypeReference<Map<String,Object>>(){});
                var safeData = new java.util.HashMap<String,Object>();
                for (String key : java.util.List.of("deepLink", "rideId", "routeId")) {
                    if (data.containsKey(key)) safeData.put(key, data.get(key));
                }
                safeData.put("tenantId", n.getTenantId()); safeData.put("recipientUserId", n.getRecipientUserId());
                safeData.put("notificationId", n.getId());
                var result=sender.send(new NotificationPushSender.PushNotificationCommand(token.get().getPushToken(),
                    "Transport update", "Open Bakaroo to view your notification.",safeData));
                sent=result.sent(); error=result.errorMessage(); receiptId=result.receiptId();
            } catch(Exception exception) { error="Push delivery provider failed."; }
            int attempts=((Number)job.get("attempts")).intValue()+1;
            tokenService.markDeliveryResult(token.get().getId(),sent,error);
            jdbc.update("UPDATE push_delivery_jobs SET status=?, error_message=?, next_attempt_at=?, receipt_id=?, accepted_at=? WHERE id=?",
                    sent ? receiptId==null ? "SENT" : "ACCEPTED" : "FAILED",error==null ? null : error.substring(0,Math.min(error.length(),500)),
                    receiptId!=null ? Timestamp.from(clock.instant().plusSeconds(900)) : sent || attempts>=5 ? null : Timestamp.from(clock.instant().plusSeconds(Math.min(900,60L*attempts*attempts))),receiptId, sent ? Timestamp.from(clock.instant()) : null,id);
        }
    }
    @Scheduled(fixedDelayString="${app.push-delivery.receipt-delay:PT1M}")
    public void reconcileReceipts() {
        var jobs=jdbc.queryForList("SELECT id,device_token_id,receipt_id,accepted_at FROM push_delivery_jobs WHERE status='ACCEPTED' AND next_attempt_at<=? ORDER BY id LIMIT 100",Timestamp.from(clock.instant()));
        for(var job:jobs) {
            long id=((Number)job.get("id")).longValue();
            var receipt=sender.receipt((String)job.get("receipt_id"));
            boolean pending="PENDING".equals(receipt.status());
            boolean expired=((Timestamp)job.get("accepted_at")).toInstant().plusSeconds(86400).isBefore(clock.instant());
            String status=pending ? expired ? "RECEIPT_UNKNOWN" : "ACCEPTED" : receipt.status();
            jdbc.update("UPDATE push_delivery_jobs SET status=?,error_message=?,receipt_attempts=receipt_attempts+1,next_attempt_at=? WHERE id=? AND status='ACCEPTED'",
                status,receipt.errorMessage(),pending && !expired ? Timestamp.from(clock.instant().plusSeconds(60)) : null,id);
            if("FAILED".equals(receipt.status())) tokenService.markDeliveryResult(((Number)job.get("device_token_id")).longValue(),false,receipt.errorMessage());
        }
    }

}
