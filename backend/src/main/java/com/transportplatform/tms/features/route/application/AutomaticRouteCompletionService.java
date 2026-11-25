package com.transportplatform.tms.features.route.application;

import com.transportplatform.tms.features.audit.application.*;
import com.transportplatform.tms.features.billing.application.RouteInvoiceService;
import com.transportplatform.tms.features.ride.domain.*;
import com.transportplatform.tms.features.route.domain.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;

/** The caller holds the tenant dispatch lock before loading the changed trip. */
@Service
public class AutomaticRouteCompletionService {
    private static final Set<RideStatus> FINISHED=EnumSet.of(RideStatus.COMPLETED,RideStatus.CANCELLED,RideStatus.MISSED,RideStatus.FAILED,RideStatus.RIDER_NO_SHOW);
    private final RouteStopRepository stops; private final RouteRepository routes; private final RouteInvoiceService invoices; private final AuditLogService audit;
    public AutomaticRouteCompletionService(RouteStopRepository stops,RouteRepository routes,RouteInvoiceService invoices,AuditLogService audit) {
        this.stops=stops;this.routes=routes;this.invoices=invoices;this.audit=audit;
    }
    @Transactional(propagation=Propagation.MANDATORY)
    public void afterTripChanged(Ride ride) {
        if(!FINISHED.contains(ride.getStatus())) return;
        var ids=stops.findAllByTenantIdAndRide_Id(ride.getTenantId(),ride.getId()).stream().map(s->s.getRoute().getId()).distinct().toList();
        for(Long id:ids) {
            var route=routes.findByIdAndTenantId(id,ride.getTenantId()).orElseThrow();
            if(route.getStatus()!=RouteStatus.IN_PROGRESS) continue;
            var manifest=stops.findAllByTenantIdAndRoute_IdOrderByStopSequenceAsc(ride.getTenantId(),id);
            if(manifest.isEmpty() || manifest.stream().anyMatch(s->!FINISHED.contains(s.getRide().getStatus()))) continue;
            route.setStatus(RouteStatus.COMPLETED);
            invoices.createDraftOnCompletion(route);
            routes.save(route);
            audit.record(new AuditLogCommand(null,ride.getTenantId(),"ROUTE","COMPLETED","ROUTE",id.toString(),
                    "Route completed automatically after its final trip finished.",Map.of("status","IN_PROGRESS"),Map.of("status","COMPLETED")));
        }
    }
}
