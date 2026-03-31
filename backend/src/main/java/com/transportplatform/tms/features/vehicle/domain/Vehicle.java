package com.transportplatform.tms.features.vehicle.domain;

import com.transportplatform.tms.common.audit.AuditableEntity;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "vehicles")
public class Vehicle extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 36)
    private String tenantId;

    @Column(name = "vehicle_code", nullable = false, length = 50)
    private String vehicleCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "ownership_type", nullable = false, length = 30)
    private VehicleOwnershipType ownershipType;

    @Column(name = "make", nullable = false, length = 120)
    private String make;

    @Column(name = "model", nullable = false, length = 120)
    private String model;

    @Column(name = "vehicle_year", nullable = false)
    private Integer year;

    @Column(name = "color", length = 80)
    private String color;

    @Column(name = "vin", length = 17)
    private String vin;

    @Column(name = "plate_number", nullable = false, length = 30)
    private String plateNumber;

    @Column(name = "plate_state", nullable = false, length = 80)
    private String plateState;

    @Column(name = "capacity", nullable = false)
    private Integer capacity;

    @Column(name = "wheelchair_capacity")
    private Integer wheelchairCapacity;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "vehicle_service_types", joinColumns = @JoinColumn(name = "vehicle_id"))
    @Column(name = "service_type", nullable = false, length = 80)
    private Set<String> serviceTypesSupported = new LinkedHashSet<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "fuel_type", length = 30)
    private VehicleFuelType fuelType;

    @Column(name = "insurance_policy_number", length = 120)
    private String insurancePolicyNumber;

    @Column(name = "insurance_expiry_date")
    private LocalDate insuranceExpiryDate;

    @Column(name = "registration_expiry_date")
    private LocalDate registrationExpiryDate;

    @Column(name = "inspection_expiry_date")
    private LocalDate inspectionExpiryDate;

    @Column(name = "mileage")
    private Long mileage;

    @Column(name = "assigned_driver_id")
    private Long assignedDriverId;

    @Column(name = "notes", length = 2000)
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private VehicleStatus status;

    public Long getId() {
        return id;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public String getVehicleCode() {
        return vehicleCode;
    }

    public void setVehicleCode(String vehicleCode) {
        this.vehicleCode = vehicleCode;
    }

    public VehicleOwnershipType getOwnershipType() {
        return ownershipType;
    }

    public void setOwnershipType(VehicleOwnershipType ownershipType) {
        this.ownershipType = ownershipType;
    }

    public String getMake() {
        return make;
    }

    public void setMake(String make) {
        this.make = make;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public String getVin() {
        return vin;
    }

    public void setVin(String vin) {
        this.vin = vin;
    }

    public String getPlateNumber() {
        return plateNumber;
    }

    public void setPlateNumber(String plateNumber) {
        this.plateNumber = plateNumber;
    }

    public String getPlateState() {
        return plateState;
    }

    public void setPlateState(String plateState) {
        this.plateState = plateState;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public Integer getWheelchairCapacity() {
        return wheelchairCapacity;
    }

    public void setWheelchairCapacity(Integer wheelchairCapacity) {
        this.wheelchairCapacity = wheelchairCapacity;
    }

    public Set<String> getServiceTypesSupported() {
        return serviceTypesSupported;
    }

    public void setServiceTypesSupported(Set<String> serviceTypesSupported) {
        this.serviceTypesSupported = serviceTypesSupported;
    }

    public VehicleFuelType getFuelType() {
        return fuelType;
    }

    public void setFuelType(VehicleFuelType fuelType) {
        this.fuelType = fuelType;
    }

    public String getInsurancePolicyNumber() {
        return insurancePolicyNumber;
    }

    public void setInsurancePolicyNumber(String insurancePolicyNumber) {
        this.insurancePolicyNumber = insurancePolicyNumber;
    }

    public LocalDate getInsuranceExpiryDate() {
        return insuranceExpiryDate;
    }

    public void setInsuranceExpiryDate(LocalDate insuranceExpiryDate) {
        this.insuranceExpiryDate = insuranceExpiryDate;
    }

    public LocalDate getRegistrationExpiryDate() {
        return registrationExpiryDate;
    }

    public void setRegistrationExpiryDate(LocalDate registrationExpiryDate) {
        this.registrationExpiryDate = registrationExpiryDate;
    }

    public LocalDate getInspectionExpiryDate() {
        return inspectionExpiryDate;
    }

    public void setInspectionExpiryDate(LocalDate inspectionExpiryDate) {
        this.inspectionExpiryDate = inspectionExpiryDate;
    }

    public Long getMileage() {
        return mileage;
    }

    public void setMileage(Long mileage) {
        this.mileage = mileage;
    }

    public Long getAssignedDriverId() {
        return assignedDriverId;
    }

    public void setAssignedDriverId(Long assignedDriverId) {
        this.assignedDriverId = assignedDriverId;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public VehicleStatus getStatus() {
        return status;
    }

    public void setStatus(VehicleStatus status) {
        this.status = status;
    }
}