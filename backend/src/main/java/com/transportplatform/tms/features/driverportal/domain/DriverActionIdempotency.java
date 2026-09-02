package com.transportplatform.tms.features.driverportal.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;

@Entity
@Table(name = "driver_action_idempotency", uniqueConstraints = @UniqueConstraint(
        name = "uq_driver_action_idempotency", columnNames = {"tenant_id", "user_id", "idempotency_key"}))
public class DriverActionIdempotency {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "tenant_id", nullable = false, length = 36)
    private String tenantId;
    @Column(name = "user_id", nullable = false)
    private Long userId;
    @Column(name = "idempotency_key", nullable = false, length = 120)
    private String idempotencyKey;
    @Column(name = "ride_id", nullable = false)
    private Long rideId;
    @Column(name = "action_name", nullable = false, length = 40)
    private String actionName;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public void setTenantId(String value) { tenantId = value; }
    public void setUserId(Long value) { userId = value; }
    public void setIdempotencyKey(String value) { idempotencyKey = value; }
    public void setRideId(Long value) { rideId = value; }
    public void setActionName(String value) { actionName = value; }
    public void setCreatedAt(Instant value) { createdAt = value; }
}

