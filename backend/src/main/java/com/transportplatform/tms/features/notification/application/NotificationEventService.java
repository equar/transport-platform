package com.transportplatform.tms.features.notification.application;

import com.transportplatform.tms.features.auth.domain.AppUser;
import com.transportplatform.tms.features.auth.domain.AppUserRepository;
import com.transportplatform.tms.features.auth.domain.RoleName;
import com.transportplatform.tms.features.auth.domain.UserStatus;
import com.transportplatform.tms.features.billing.domain.Invoice;
import com.transportplatform.tms.features.billing.domain.Payment;
import com.transportplatform.tms.features.compliance.domain.ComplianceIssue;
import com.transportplatform.tms.features.companyapplication.domain.CompanyApplication;
import com.transportplatform.tms.features.driver.domain.Driver;
import com.transportplatform.tms.features.driver.domain.DriverDocument;
import com.transportplatform.tms.features.driver.domain.DriverStatus;
import com.transportplatform.tms.features.notification.domain.NotificationType;
import com.transportplatform.tms.features.portalaccess.domain.PortalSubjectType;
import com.transportplatform.tms.features.portalaccess.domain.PortalUserScopeRepository;
import com.transportplatform.tms.features.ride.domain.Ride;
import com.transportplatform.tms.features.ride.domain.RideStatus;
import com.transportplatform.tms.features.rider.domain.RiderGuardian;
import com.transportplatform.tms.features.rider.domain.RiderGuardianRepository;
import com.transportplatform.tms.features.rider.domain.RiderGuardianStatus;
import com.transportplatform.tms.features.vehicle.domain.Vehicle;
import com.transportplatform.tms.features.vehicle.domain.VehicleDocument;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class NotificationEventService {

    private final NotificationDispatchService notificationDispatchService;
    private final NotificationEmailSender notificationEmailSender;
    private final AppUserRepository appUserRepository;
    private final PortalUserScopeRepository portalUserScopeRepository;
    private final RiderGuardianRepository riderGuardianRepository;

    public NotificationEventService(NotificationDispatchService notificationDispatchService,
            NotificationEmailSender notificationEmailSender,
            AppUserRepository appUserRepository,
            PortalUserScopeRepository portalUserScopeRepository,
            RiderGuardianRepository riderGuardianRepository) {
        this.notificationDispatchService = notificationDispatchService;
        this.notificationEmailSender = notificationEmailSender;
        this.appUserRepository = appUserRepository;
        this.portalUserScopeRepository = portalUserScopeRepository;
        this.riderGuardianRepository = riderGuardianRepository;
    }

    public void publishCompanyApplicationSubmitted(CompanyApplication application) {
        notifyTenantAdmins(
                application.getApprovedTenantId(),
                NotificationType.COMPANY_APPLICATION_SUBMITTED,
                "COMPANY_APPLICATION",
                application.getId(),
                "New company application submitted",
                "Company application " + application.getApplicationNumber() + " was submitted for review.",
                Map.of(
                        "applicationNumber", application.getApplicationNumber(),
                        "companyName", application.getLegalCompanyName()));
    }

    public void publishCompanyApplicationApproved(CompanyApplication application) {
        if (application.getApprovedTenantId() == null || application.getOwnerUserId() == null) {
            return;
        }
        appUserRepository.findByIdAndTenantId(application.getOwnerUserId(), application.getApprovedTenantId())
                .ifPresent(owner -> notifyUser(
                        owner,
                        NotificationType.COMPANY_APPLICATION_APPROVED,
                        "COMPANY_APPLICATION",
                        application.getId(),
                        "Company application approved",
                        "Your company application " + application.getApplicationNumber() + " was approved.",
                        "Company application approved",
                        Map.of(
                                "applicationNumber", application.getApplicationNumber(),
                                "companyName", application.getLegalCompanyName())));
    }

    public void publishCompanyApplicationRejected(CompanyApplication application) {
        String subject = "Company application update";
        String body = "Company application " + application.getApplicationNumber() + " was rejected."
                + (application.getRejectionReason() == null || application.getRejectionReason().isBlank()
                        ? ""
                        : " Reason: " + application.getRejectionReason());
        if (application.getEmail() != null && !application.getEmail().isBlank()) {
            notificationEmailSender.send(new NotificationEmailSender.NotificationEmailCommand(
                    application.getEmail().trim(),
                    subject,
                    subject,
                    body));
        }
    }

    public void publishCompanyUserCreated(AppUser user) {
        notifyUser(
                user,
                NotificationType.COMPANY_USER_CREATED,
                "USER",
                user.getId(),
                "User account created",
                "Your company user account has been created.",
                "Your user account is ready",
                Map.of("email", user.getEmail(), "roles", user.getRoles().stream().map(Enum::name).toList()));
    }

    public void publishCompanyUserActivated(AppUser user) {
        notifyUser(
                user,
                NotificationType.COMPANY_USER_ACTIVATED,
                "USER",
                user.getId(),
                "User account activated",
                "Your company user account is now active.",
                "Your user account is active",
                Map.of("email", user.getEmail()));
    }

    public void publishCompanyUserSuspended(AppUser user) {
        notifyUser(
                user,
                NotificationType.COMPANY_USER_SUSPENDED,
                "USER",
                user.getId(),
                "User account suspended",
                "Your company user account has been suspended.",
                "Your user account was suspended",
                Map.of("email", user.getEmail()));
    }

    public void publishDriverStatusChanged(Driver driver, DriverStatus previousStatus, DriverStatus currentStatus) {
        notifyTenantAdmins(
                driver.getTenantId(),
                NotificationType.DRIVER_STATUS_CHANGED,
                "DRIVER",
                driver.getId(),
                "Driver status changed",
                "Driver " + driver.getDriverCode() + " moved from " + previousStatus.name() + " to "
                        + currentStatus.name() + ".",
                Map.of(
                        "driverCode", driver.getDriverCode(),
                        "previousStatus", previousStatus.name(),
                        "currentStatus", currentStatus.name()));
    }

    public void publishDriverDocumentVerified(DriverDocument document) {
        notifyTenantAdmins(
                document.getTenantId(),
                NotificationType.DRIVER_DOCUMENT_VERIFIED,
                "DRIVER_DOCUMENT",
                document.getId(),
                "Driver document verified",
                "Driver document " + document.getDocumentType().name() + " was verified.",
                Map.of(
                        "driverId", document.getDriver().getId(),
                        "documentType", document.getDocumentType().name()));
    }

    public void publishDriverDocumentRejected(DriverDocument document) {
        notifyTenantAdmins(
                document.getTenantId(),
                NotificationType.DRIVER_DOCUMENT_REJECTED,
                "DRIVER_DOCUMENT",
                document.getId(),
                "Driver document rejected",
                "Driver document " + document.getDocumentType().name() + " was rejected.",
                Map.of(
                        "driverId", document.getDriver().getId(),
                        "documentType", document.getDocumentType().name()));
    }

    public void publishVehicleDocumentVerified(VehicleDocument document) {
        notifyTenantAdmins(
                document.getTenantId(),
                NotificationType.VEHICLE_DOCUMENT_VERIFIED,
                "VEHICLE_DOCUMENT",
                document.getId(),
                "Vehicle document verified",
                "Vehicle document " + document.getDocumentType().name() + " was verified.",
                Map.of(
                        "vehicleId", document.getVehicle().getId(),
                        "documentType", document.getDocumentType().name()));
    }

    public void publishVehicleDocumentRejected(VehicleDocument document) {
        notifyTenantAdmins(
                document.getTenantId(),
                NotificationType.VEHICLE_DOCUMENT_REJECTED,
                "VEHICLE_DOCUMENT",
                document.getId(),
                "Vehicle document rejected",
                "Vehicle document " + document.getDocumentType().name() + " was rejected.",
                Map.of(
                        "vehicleId", document.getVehicle().getId(),
                        "documentType", document.getDocumentType().name()));
    }

    public void publishRideDriverAssigned(Ride ride, Driver driver) {
        notifyTenantAdmins(
                ride.getTenantId(),
                NotificationType.RIDE_DRIVER_ASSIGNED,
                "RIDE",
                ride.getId(),
                "Ride driver assigned",
                "Driver " + driver.getDriverCode() + " was assigned to ride " + ride.getRideNumber() + ".",
                Map.of("rideNumber", ride.getRideNumber(), "driverCode", driver.getDriverCode()));
        notifyRideDriver(
                ride,
                driver,
                NotificationType.RIDE_ASSIGNED_TO_DRIVER,
                "New ride assigned",
                "You were assigned to ride " + ride.getRideNumber() + ".",
                buildRideContext(ride, "DRIVER", Map.of("driverCode", driver.getDriverCode())));
        if (ride.getVehicleId() != null) {
            notifyRidePassengers(
                    ride,
                    NotificationType.RIDE_READY_FOR_RIDER,
                    "Ride assignment confirmed",
                    "Ride " + ride.getRideNumber() + " now has a driver assigned and is ready to track.",
                    buildRideContext(ride, "RIDER", Map.of("driverCode", driver.getDriverCode())));
            notifyRidePassengers(
                    ride,
                    NotificationType.RIDE_TRACKING_AVAILABLE,
                    "Ride tracking available",
                    "Live ride tracking is now available for ride " + ride.getRideNumber() + ".",
                    buildRideContext(ride, "RIDER", Map.of("driverCode", driver.getDriverCode())));
        }
    }

    public void publishRideVehicleAssigned(Ride ride, Vehicle vehicle) {
        notifyTenantAdmins(
                ride.getTenantId(),
                NotificationType.RIDE_VEHICLE_ASSIGNED,
                "RIDE",
                ride.getId(),
                "Ride vehicle assigned",
                "Vehicle " + vehicle.getVehicleCode() + " was assigned to ride " + ride.getRideNumber() + ".",
                Map.of("rideNumber", ride.getRideNumber(), "vehicleCode", vehicle.getVehicleCode()));
        if (ride.getDriverId() != null) {
            notifyRidePassengers(
                    ride,
                    NotificationType.RIDE_READY_FOR_RIDER,
                    "Ride assignment confirmed",
                    "Ride " + ride.getRideNumber() + " now has a vehicle assigned and is ready to track.",
                    buildRideContext(ride, "RIDER", Map.of("vehicleCode", vehicle.getVehicleCode())));
            notifyRidePassengers(
                    ride,
                    NotificationType.RIDE_TRACKING_AVAILABLE,
                    "Ride tracking available",
                    "Live ride tracking is now available for ride " + ride.getRideNumber() + ".",
                    buildRideContext(ride, "RIDER", Map.of("vehicleCode", vehicle.getVehicleCode())));
        }
    }

    public void publishRideStatusChanged(Ride ride, RideStatus previousStatus, RideStatus currentStatus) {
        notifyTenantAdmins(
                ride.getTenantId(),
                NotificationType.RIDE_STATUS_CHANGED,
                "RIDE",
                ride.getId(),
                "Ride status changed",
                "Ride " + ride.getRideNumber() + " moved from " + previousStatus.name() + " to "
                        + currentStatus.name() + ".",
                Map.of(
                        "rideNumber", ride.getRideNumber(),
                        "previousStatus", previousStatus.name(),
                        "currentStatus", currentStatus.name()));
        publishRideParticipantStatusChanged(ride, previousStatus, currentStatus);
    }

    public void publishInvoiceIssued(Invoice invoice) {
        notifyTenantAdmins(
                invoice.getTenantId(),
                NotificationType.INVOICE_ISSUED,
                "INVOICE",
                invoice.getId(),
                "Invoice issued",
                "Invoice " + invoice.getInvoiceNumber() + " was issued for " + invoice.getBillToNameSnapshot() + ".",
                Map.of(
                        "invoiceNumber", invoice.getInvoiceNumber(),
                        "billToName", invoice.getBillToNameSnapshot(),
                        "balanceDue", invoice.getBalanceDue()));
    }

    public void publishPaymentRecorded(Payment payment, boolean appliedImmediately) {
        notifyTenantAdmins(
                payment.getTenantId(),
                NotificationType.PAYMENT_RECORDED,
                "PAYMENT",
                payment.getId(),
                "Payment recorded",
                "Payment " + payment.getPaymentNumber() + " was recorded for invoice "
                        + payment.getInvoice().getInvoiceNumber() + ".",
                buildPaymentContext(payment, appliedImmediately));
    }

    public void publishPaymentApplied(Payment payment) {
        notifyTenantAdmins(
                payment.getTenantId(),
                NotificationType.PAYMENT_APPLIED,
                "PAYMENT",
                payment.getId(),
                "Payment applied",
                "Payment " + payment.getPaymentNumber() + " was applied to invoice "
                        + payment.getInvoice().getInvoiceNumber() + ".",
                buildPaymentContext(payment, true));
    }

    public void publishComplianceIssueOpened(ComplianceIssue issue) {
        notifyTenantAdmins(
                issue.getTenantId(),
                NotificationType.COMPLIANCE_ISSUE_OPENED,
                "COMPLIANCE_ISSUE",
                issue.getId(),
                "Compliance issue opened",
                issue.getSummary(),
                Map.of(
                        "entityType", issue.getEntityType().name(),
                        "entityCode", issue.getEntityCode(),
                        "severity", issue.getSeverity().name(),
                        "issueType", issue.getIssueType().name(),
                        "relatedDocumentType",
                        issue.getRelatedDocumentType() == null ? "" : issue.getRelatedDocumentType()));
    }

    private void notifyTenantAdmins(String tenantId,
            NotificationType notificationType,
            String relatedEntityType,
            Object relatedEntityId,
            String title,
            String message,
            Map<String, Object> context) {
        if (tenantId == null || tenantId.isBlank()) {
            return;
        }
        List<AppUser> adminRecipients = appUserRepository.findAllByTenantId(tenantId).stream()
                .filter(user -> user.getStatus() == UserStatus.ACTIVE)
                .filter(user -> user.getRoles().contains(RoleName.ROLE_TENANT_ADMIN))
                .toList();
        for (AppUser adminRecipient : adminRecipients) {
            notifyUser(adminRecipient, notificationType, relatedEntityType, relatedEntityId, title, message, title,
                    context);
        }
    }

    private void publishRideParticipantStatusChanged(Ride ride, RideStatus previousStatus, RideStatus currentStatus) {
        ParticipantNotification participantNotification = switch (currentStatus) {
            case ASSIGNED -> new ParticipantNotification(
                    NotificationType.RIDE_READY_FOR_RIDER,
                    "Ride assignment confirmed",
                    "Ride " + ride.getRideNumber() + " is assigned and ready to track.");
            case DRIVER_EN_ROUTE -> new ParticipantNotification(
                    NotificationType.RIDE_DRIVER_EN_ROUTE,
                    "Driver en route",
                    "Your driver is en route for ride " + ride.getRideNumber() + ".");
            case ARRIVED -> new ParticipantNotification(
                    NotificationType.RIDE_DRIVER_ARRIVED,
                    "Driver arrived",
                    "Your driver has arrived for ride " + ride.getRideNumber() + ".");
            case PICKED_UP -> new ParticipantNotification(
                    NotificationType.RIDE_PICKUP_CONFIRMED,
                    "Pickup confirmed",
                    "Pickup was confirmed for ride " + ride.getRideNumber() + ".");
            case DROPPED_OFF -> new ParticipantNotification(
                    NotificationType.RIDE_DROPOFF_CONFIRMED,
                    "Drop-off confirmed",
                    "Drop-off was confirmed for ride " + ride.getRideNumber() + ".");
            case COMPLETED -> new ParticipantNotification(
                    NotificationType.RIDE_COMPLETED_FOR_PARTICIPANT,
                    "Ride completed",
                    "Ride " + ride.getRideNumber() + " was completed.");
            case CANCELLED -> new ParticipantNotification(
                    NotificationType.RIDE_CANCELLED_FOR_PARTICIPANT,
                    "Ride cancelled",
                    "Ride " + ride.getRideNumber() + " was cancelled.");
            default -> null;
        };
        if (participantNotification == null) {
            return;
        }

        Map<String, Object> context = buildRideContext(
                ride,
                "RIDER",
                Map.of(
                        "previousStatus", previousStatus.name(),
                        "currentStatus", currentStatus.name()));
        notifyRidePassengers(ride, participantNotification.notificationType(),
                participantNotification.title(), participantNotification.message(), context);

        if (ride.getDriverId() != null) {
            notifyRideDriver(
                    ride,
                    null,
                    participantNotification.notificationType(),
                    participantNotification.title(),
                    participantNotification.message(),
                    buildRideContext(
                            ride,
                            "DRIVER",
                            Map.of(
                                    "previousStatus", previousStatus.name(),
                                    "currentStatus", currentStatus.name())));
        }
    }

    private void notifyRideDriver(Ride ride,
            Driver driver,
            NotificationType notificationType,
            String title,
            String message,
            Map<String, Object> context) {
        if (ride.getDriverId() == null) {
            return;
        }
        notifyPortalSubjectUsers(
                ride.getTenantId(),
                PortalSubjectType.DRIVER,
                Set.of(ride.getDriverId()),
                notificationType,
                "RIDE",
                ride.getId(),
                title,
                message,
                user -> mergeContext(context, Map.of(
                        "audience", "DRIVER",
                        "portalScope", "driver",
                        "deepLink", "/(driver)/rides/" + ride.getId(),
                        "driverId", ride.getDriverId(),
                        "driverCode", driver == null ? "" : driver.getDriverCode())));
    }

    private void notifyRidePassengers(Ride ride,
            NotificationType notificationType,
            String title,
            String message,
            Map<String, Object> context) {
        if (ride.getRider() != null && ride.getRider().getId() != null) {
            notifyPortalSubjectUsers(
                    ride.getTenantId(),
                    PortalSubjectType.RIDER,
                    Set.of(ride.getRider().getId()),
                    notificationType,
                    "RIDE",
                    ride.getId(),
                    title,
                    message,
                    user -> mergeContext(context, Map.of(
                            "audience", "RIDER",
                            "portalScope", "rider",
                            "deepLink", "/(rider)/rides/" + ride.getId(),
                            "riderId", ride.getRider().getId())));
        }

        Set<Long> guardianIds = new LinkedHashSet<>();
        if (ride.getGuardian() != null && ride.getGuardian().getId() != null) {
            guardianIds.add(ride.getGuardian().getId());
        }
        if (ride.getRider() != null && ride.getRider().getId() != null) {
            riderGuardianRepository.findAllByTenantIdAndRider_IdAndStatusOrderByPrimaryGuardianDescUpdatedAtDesc(
                            ride.getTenantId(),
                            ride.getRider().getId(),
                            RiderGuardianStatus.ACTIVE)
                    .stream()
                    .map(RiderGuardian::getGuardian)
                    .filter(guardian -> guardian != null && guardian.getId() != null)
                    .map(guardian -> guardian.getId())
                    .forEach(guardianIds::add);
        }
        if (!guardianIds.isEmpty()) {
            notifyPortalSubjectUsers(
                    ride.getTenantId(),
                    PortalSubjectType.GUARDIAN,
                    guardianIds,
                    notificationType,
                    "RIDE",
                    ride.getId(),
                    title,
                    message,
                    user -> mergeContext(context, Map.of(
                            "audience", "GUARDIAN",
                            "portalScope", "guardian",
                            "deepLink", "/(guardian)/rides/" + ride.getId(),
                            "riderId", ride.getRider() == null ? "" : ride.getRider().getId())));
        }
    }

    private void notifyPortalSubjectUsers(String tenantId,
            PortalSubjectType portalSubjectType,
            Set<Long> subjectIds,
            NotificationType notificationType,
            String relatedEntityType,
            Object relatedEntityId,
            String title,
            String message,
            java.util.function.Function<AppUser, Map<String, Object>> contextBuilder) {
        if (tenantId == null || tenantId.isBlank() || subjectIds == null || subjectIds.isEmpty()) {
            return;
        }
        List<AppUser> recipients = portalUserScopeRepository.findAllByTenantIdAndPortalSubjectType(tenantId, portalSubjectType)
                .stream()
                .filter(scope -> subjectIds.contains(scope.getPortalSubjectId()))
                .map(scope -> appUserRepository.findById(scope.getAppUserId()).orElse(null))
                .filter(user -> user != null && user.getStatus() == UserStatus.ACTIVE && user.isActiveForLogin())
                .toList();
        for (AppUser recipient : recipients) {
            notifyUser(recipient, notificationType, relatedEntityType, relatedEntityId, title, message, title,
                    contextBuilder.apply(recipient));
        }
    }

    private void notifyUser(AppUser user,
            NotificationType notificationType,
            String relatedEntityType,
            Object relatedEntityId,
            String title,
            String message,
            String emailSubject,
            Map<String, Object> context) {
        if (user.getTenantId() == null || user.getId() == null) {
            return;
        }
        Map<String, Object> metadata = new LinkedHashMap<>(context);
        metadata.putIfAbsent("recipientEmail", user.getEmail());
        notificationDispatchService.notifyInApp(
                user.getTenantId(),
                user.getId(),
                notificationType,
                relatedEntityType,
                relatedEntityId == null ? null : relatedEntityId.toString(),
                title,
                message,
                metadata);
        notificationDispatchService.notifyEmail(
                user.getTenantId(),
                user.getId(),
                user.getEmail(),
                notificationType,
                relatedEntityType,
                relatedEntityId == null ? null : relatedEntityId.toString(),
                emailSubject,
                title,
                message,
                metadata);
    }

    private Map<String, Object> buildPaymentContext(Payment payment, boolean appliedImmediately) {
        return Map.of(
                "paymentNumber", payment.getPaymentNumber(),
                "invoiceNumber", payment.getInvoice().getInvoiceNumber(),
                "amount", payment.getAmount(),
                "appliedImmediately", appliedImmediately);
    }

    private Map<String, Object> buildRideContext(Ride ride, String audience, Map<String, Object> extra) {
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("rideId", ride.getId());
        metadata.put("rideNumber", ride.getRideNumber());
        metadata.put("rideStatus", ride.getStatus().name());
        metadata.put("serviceType", ride.getServiceType() == null ? null : ride.getServiceType().name());
        metadata.put("scheduledPickupAt", ride.getScheduledPickupAt());
        metadata.put("scheduledDropoffAt", ride.getScheduledDropoffAt());
        metadata.put("pickupAddress", formatAddress(
                ride.getPickupAddressLine1(),
                ride.getPickupAddressLine2(),
                ride.getPickupCity(),
                ride.getPickupState(),
                ride.getPickupZipCode()));
        metadata.put("dropoffAddress", formatAddress(
                ride.getDropoffAddressLine1(),
                ride.getDropoffAddressLine2(),
                ride.getDropoffCity(),
                ride.getDropoffState(),
                ride.getDropoffZipCode()));
        metadata.put("riderName", ride.getRider() == null ? null : fullName(ride.getRider().getFirstName(), ride.getRider().getLastName()));
        metadata.put("guardianName", ride.getGuardian() == null ? null : fullName(ride.getGuardian().getFirstName(), ride.getGuardian().getLastName()));
        metadata.put("organizationName", ride.getOrganization() == null ? null : ride.getOrganization().getName());
        metadata.put("routeId", ride.getRouteId());
        metadata.put("audience", audience);
        if (extra != null) {
            metadata.putAll(extra);
        }
        return metadata;
    }

    private Map<String, Object> mergeContext(Map<String, Object> base, Map<String, Object> extra) {
        Map<String, Object> metadata = new LinkedHashMap<>();
        if (base != null) {
            metadata.putAll(base);
        }
        if (extra != null) {
            metadata.putAll(extra);
        }
        return metadata;
    }

    private String formatAddress(String line1, String line2, String city, String state, String zipCode) {
        return List.of(trimToNull(line1), trimToNull(line2), trimToNull(city), trimToNull(state), trimToNull(zipCode))
                .stream()
                .filter(value -> value != null && !value.isBlank())
                .reduce((left, right) -> left + ", " + right)
                .orElse(null);
    }

    private String fullName(String firstName, String lastName) {
        String value = ((firstName == null ? "" : firstName.trim()) + " " + (lastName == null ? "" : lastName.trim()))
                .trim();
        return value.isBlank() ? null : value;
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private record ParticipantNotification(NotificationType notificationType, String title, String message) {
    }
}
