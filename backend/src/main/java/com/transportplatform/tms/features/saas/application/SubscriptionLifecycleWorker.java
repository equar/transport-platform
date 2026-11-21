package com.transportplatform.tms.features.saas.application;

import org.springframework.stereotype.Component;
import org.springframework.scheduling.annotation.Scheduled;

@Component
public class SubscriptionLifecycleWorker {
    private final SubscriptionLifecycleService service;
    public SubscriptionLifecycleWorker(SubscriptionLifecycleService service) { this.service=service; }
    @Scheduled(fixedDelayString="${app.subscription-access.interval-ms:900000}",initialDelayString="${app.subscription-access.initial-delay-ms:120000}")
    public void run() {
        long cursor=0;
        while(true) {
            var ids=service.candidates(cursor); if(ids.isEmpty()) return;
            for(long id:ids) {
                cursor=id;
                try { service.reconcile(id); }
                catch(RuntimeException e) { org.slf4j.LoggerFactory.getLogger(getClass()).warn("Subscription access reconciliation failed subscriptionId={}",id); }
            }
        }
    }
}
