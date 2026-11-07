package com.transportplatform.tms.features.ride.application;
import com.transportplatform.tms.features.settings.domain.TenantSettingsRepository;
import com.transportplatform.tms.features.ride.api.request.RideUpsertRequest;
import com.transportplatform.tms.common.exception.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import java.time.*;
@Component
public class RideScheduleValidator {
    private final TenantSettingsRepository settings;
    public RideScheduleValidator(TenantSettingsRepository settings) {this.settings=settings;}
    public void validate(String tenantId,RideUpsertRequest request) {
        ZoneId zone=ZoneId.of(settings.findById(tenantId).map(s->s.getTimezone()).orElse("UTC"));
        for(LocalDateTime time: new LocalDateTime[]{request.scheduledPickupAt(),request.scheduledDropoffAt(),request.returnPickupAt(),request.returnDropoffAt()}) {
            if(time!=null && zone.getRules().getValidOffsets(time).size()!=1) throw new ApiException(ErrorCode.VALIDATION_FAILED,HttpStatus.BAD_REQUEST,
                "This local time is ambiguous or unavailable during a daylight-saving change in "+zone+". Choose another time.");
        }
        if(request.returnPickupAt()!=null && request.scheduledPickupAt()!=null && !request.returnPickupAt().isAfter(request.scheduledPickupAt()))
            throw new ApiException(ErrorCode.VALIDATION_FAILED,HttpStatus.BAD_REQUEST,"Return pickup must be after outbound pickup.");
    }
}
