package com.transportplatform.tms.features.route.domain;

import com.transportplatform.tms.common.audit.AuditableEntity;
import com.transportplatform.tms.features.ride.domain.Ride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "route_stops")
public class RouteStop extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 36)
    private String tenantId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "route_id", nullable = false)
    private Route route;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ride_id", nullable = false)
    private Ride ride;

    @Column(name = "stop_sequence", nullable = false)
    private int stopSequence;

    @Column(name = "planned_pickup_at")
    private LocalDateTime plannedPickupAt;

    @Column(name = "planned_dropoff_at")
    private LocalDateTime plannedDropoffAt;

    @Column(name = "notes", length = 1000)
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private RouteStopStatus status;

    public Long getId() {
        return id;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public Route getRoute() {
        return route;
    }

    public void setRoute(Route route) {
        this.route = route;
    }

    public Ride getRide() {
        return ride;
    }

    public void setRide(Ride ride) {
        this.ride = ride;
    }

    public int getStopSequence() {
        return stopSequence;
    }

    public void setStopSequence(int stopSequence) {
        this.stopSequence = stopSequence;
    }

    public LocalDateTime getPlannedPickupAt() {
        return plannedPickupAt;
    }

    public void setPlannedPickupAt(LocalDateTime plannedPickupAt) {
        this.plannedPickupAt = plannedPickupAt;
    }

    public LocalDateTime getPlannedDropoffAt() {
        return plannedDropoffAt;
    }

    public void setPlannedDropoffAt(LocalDateTime plannedDropoffAt) {
        this.plannedDropoffAt = plannedDropoffAt;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public RouteStopStatus getStatus() {
        return status;
    }

    public void setStatus(RouteStopStatus status) {
        this.status = status;
    }
}