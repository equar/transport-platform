package com.transportplatform.tms.features.ride.application;

import com.transportplatform.tms.common.exception.*;
import com.transportplatform.tms.features.ride.domain.*;
import com.transportplatform.tms.features.rideevent.application.RideEventService;
import com.transportplatform.tms.features.audit.application.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Map;

/** A round-trip request creates two independently dispatched and tracked one-way legs atomically. */
@Service
public class RideJourneyService {
    private final RideRepository rides;
    private final RideCodeGenerator codes;
    private final RideEventService events;
    private final AuditLogService audit;
    public RideJourneyService(RideRepository rides,RideCodeGenerator codes,RideEventService events,AuditLogService audit) {
        this.rides=rides;this.codes=codes;this.events=events;this.audit=audit;
    }
    @Transactional public void split(Ride outbound) {
        if(outbound.getTripType()!=RideTripType.ROUND_TRIP || outbound.getLinkedRideId()!=null) return;
        if(outbound.getReturnPickupAt()==null || outbound.getReturnDropoffAt()==null) throw new ApiException(
                ErrorCode.VALIDATION_FAILED,HttpStatus.BAD_REQUEST,"A return pickup and drop-off schedule is required.");
        Ride back=new Ride();
        back.setTenantId(outbound.getTenantId());back.setRideNumber(codes.generate(outbound.getTenantId()));
        back.setRider(outbound.getRider());back.setGuardian(outbound.getGuardian());back.setOrganization(outbound.getOrganization());
        back.setContract(outbound.getContract());back.setServiceArea(outbound.getServiceArea());back.setServiceType(outbound.getServiceType());back.setTripType(RideTripType.ONE_WAY);
        back.setPickupAddressLine1(outbound.getDropoffAddressLine1());back.setPickupAddressLine2(outbound.getDropoffAddressLine2());
        back.setPickupCity(outbound.getDropoffCity());back.setPickupState(outbound.getDropoffState());back.setPickupZipCode(outbound.getDropoffZipCode());back.setPickupCountry(outbound.getDropoffCountry());
        back.setDropoffAddressLine1(outbound.getPickupAddressLine1());back.setDropoffAddressLine2(outbound.getPickupAddressLine2());
        back.setDropoffCity(outbound.getPickupCity());back.setDropoffState(outbound.getPickupState());back.setDropoffZipCode(outbound.getPickupZipCode());back.setDropoffCountry(outbound.getPickupCountry());
        back.setScheduledPickupAt(outbound.getReturnPickupAt());back.setScheduledDropoffAt(outbound.getReturnDropoffAt());
        back.setWheelchairRequired(outbound.isWheelchairRequired());back.setEscortRequired(outbound.isEscortRequired());back.setCompanionCount(outbound.getCompanionCount());
        back.setSpecialInstructions(outbound.getSpecialInstructions());back.setInternalNotes(outbound.getInternalNotes());back.setOperationalNotes(outbound.getOperationalNotes());
        back.setPriorityLevel(outbound.getPriorityLevel());back.setBillingType(outbound.getBillingType());
        back.setStatus(switch(outbound.getStatus()) {case DRAFT,REQUESTED,PENDING_REVIEW -> outbound.getStatus();default -> RideStatus.SCHEDULED;});
        outbound.setTripType(RideTripType.ONE_WAY);outbound.setJourneyLeg("OUTBOUND");outbound.setReturnPickupAt(null);outbound.setReturnDropoffAt(null);
        rides.saveAndFlush(outbound);back.setLinkedRideId(outbound.getId());back.setJourneyLeg("RETURN");rides.saveAndFlush(back);
        outbound.setLinkedRideId(back.getId());rides.saveAndFlush(outbound);
        events.recordRideCreated(back,"Return journey linked to " + outbound.getRideNumber() + ". Dispatch separately.");
        audit.record(new AuditLogCommand(null,back.getTenantId(),"RIDE","RETURN_LEG_CREATED","RIDE",back.getId().toString(),
                "Created linked return journey.",null,Map.of("outboundRideId",outbound.getId(),"returnRideId",back.getId())));
    }
}
