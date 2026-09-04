package com.transportplatform.tms.features.notification.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.transportplatform.tms.features.notification.domain.NotificationChannel;
import com.transportplatform.tms.features.notification.domain.NotificationDeliveryStatus;
import com.transportplatform.tms.features.notification.domain.NotificationRepository;
import com.transportplatform.tms.features.notification.domain.NotificationStatus;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class NotificationDeliveryHealthIndicatorTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Test
    void reportsTerminalEmailFailureCountWithoutMarkingApplicationDown() {
        when(notificationRepository.countByChannelAndDeliveryStatusAndNextDeliveryAttemptAtIsNullAndStatus(
                NotificationChannel.EMAIL,
                NotificationDeliveryStatus.FAILED,
                NotificationStatus.ACTIVE)).thenReturn(2L);

        var health = new NotificationDeliveryHealthIndicator(notificationRepository).health();

        assertThat(health.getStatus().getCode()).isEqualTo("UP");
        assertThat(health.getDetails()).containsEntry("terminalEmailFailureCount", 2L);
    }
}