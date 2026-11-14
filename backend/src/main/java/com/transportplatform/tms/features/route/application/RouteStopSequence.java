package com.transportplatform.tms.features.route.application;

import com.transportplatform.tms.features.route.domain.RouteStop;
import com.transportplatform.tms.features.route.domain.RouteStopRepository;
import java.util.List;

final class RouteStopSequence {

    private RouteStopSequence() {
    }

    static void persist(RouteStopRepository repository, List<RouteStop> orderedStops) {
        for (int index = 0; index < orderedStops.size(); index++) {
            orderedStops.get(index).setStopSequence(-(index + 1));
        }
        repository.saveAll(orderedStops);
        repository.flush();

        for (int index = 0; index < orderedStops.size(); index++) {
            orderedStops.get(index).setStopSequence(index + 1);
        }
        repository.saveAll(orderedStops);
        repository.flush();
    }
}
