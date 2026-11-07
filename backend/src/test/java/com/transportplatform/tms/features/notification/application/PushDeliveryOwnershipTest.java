package com.transportplatform.tms.features.notification.application;
import com.transportplatform.tms.features.notification.domain.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.SimpleTransactionStatus;
import org.junit.jupiter.api.Test;
import java.time.*;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
class PushDeliveryOwnershipTest {
    @Test void reassignedDeviceTokenNeverReceivesAnotherUsersQueuedNotification() {
        var jdbc=mock(JdbcTemplate.class);var notifications=mock(NotificationRepository.class);var tokens=mock(PortalPushDeviceTokenRepository.class);
        var sender=mock(NotificationPushSender.class);var tx=mock(PlatformTransactionManager.class);
        when(tx.getTransaction(any())).thenReturn(new SimpleTransactionStatus());
        when(jdbc.queryForList(anyString(),eq(Long.class),any())).thenReturn(List.of(1L));
        Map<String,Object> job=Map.of("id",1L,"notification_id",2L,"device_token_id",3L,"attempts",0);
        when(jdbc.queryForList(anyString(),eq(1L),any())).thenReturn(List.of(job));
        Notification n=new Notification();n.setTenantId("tenant-a");n.setRecipientUserId(7L);when(notifications.findById(2L)).thenReturn(Optional.of(n));
        PortalPushDeviceToken t=new PortalPushDeviceToken();t.setTenantId("tenant-b");t.setAppUserId(8L);t.setStatus(PortalPushDeviceTokenStatus.ACTIVE);when(tokens.findById(3L)).thenReturn(Optional.of(t));
        var worker=new PushDeliveryWorker(jdbc,notifications,tokens,sender,mock(PortalPushDeviceTokenService.class),new ObjectMapper(),Clock.systemUTC(),tx,mock(NotificationDeliveryAccess.class));
        worker.deliverDue();
        verifyNoInteractions(sender);
        verify(jdbc).update("UPDATE push_delivery_jobs SET status='SKIPPED', next_attempt_at=NULL WHERE id=?",1L);
    }
}
