package com.transportplatform.tms.features.notification.application;

import java.util.Map;

public interface NotificationPushSender {

    DeliveryResult send(PushNotificationCommand command);

    record PushNotificationCommand(String token, String title, String body, Map<String, Object> data) {
    }

    default ReceiptResult receipt(String id) {return new ReceiptResult("UNSUPPORTED",null);}
    record ReceiptResult(String status,String errorMessage) {}
    record DeliveryResult(boolean sent, String errorMessage, String receiptId) {
        public DeliveryResult(boolean sent,String errorMessage) {this(sent,errorMessage,null);}
    }
}
