package com.transportplatform.tms.features.driverearnings.domain;
import com.transportplatform.tms.common.audit.AuditableEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;
@Entity @Table(name="driver_earnings_ledger")
public class DriverEarningsLedger extends AuditableEntity {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(name="tenant_id",nullable=false,length=36) private String tenantId;
 @Column(name="driver_id",nullable=false) private Long driverId;
 @Column(name="ride_id") private Long rideId;
 @Enumerated(EnumType.STRING) @Column(name="entry_type",nullable=false,length=30) private DriverEarningsEntryType entryType;
 @Enumerated(EnumType.STRING) @Column(name="status",nullable=false,length=30) private DriverEarningsStatus status;
 @Column(name="amount",precision=12,scale=2) private BigDecimal amount;
 @Column(name="currency",nullable=false,length=3) private String currency;
 @Column(name="invoice_total",precision=12,scale=2) private BigDecimal billableAmount;
 @Column(name="earnings_rate",precision=5,scale=2) private BigDecimal earningsRate;
 @Column(name="reason",length=1000) private String reason;
 public Long getId(){return id;} public String getTenantId(){return tenantId;} public void setTenantId(String v){tenantId=v;} public Long getDriverId(){return driverId;} public void setDriverId(Long v){driverId=v;} public Long getRideId(){return rideId;} public void setRideId(Long v){rideId=v;} public DriverEarningsEntryType getEntryType(){return entryType;} public void setEntryType(DriverEarningsEntryType v){entryType=v;} public DriverEarningsStatus getStatus(){return status;} public void setStatus(DriverEarningsStatus v){status=v;} public BigDecimal getAmount(){return amount;} public void setAmount(BigDecimal v){amount=v;} public String getCurrency(){return currency;} public void setCurrency(String v){currency=v;} public BigDecimal getBillableAmount(){return billableAmount;} public void setBillableAmount(BigDecimal v){billableAmount=v;} public BigDecimal getEarningsRate(){return earningsRate;} public void setEarningsRate(BigDecimal v){earningsRate=v;} public String getReason(){return reason;} public void setReason(String v){reason=v;}
}
