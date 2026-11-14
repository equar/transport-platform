package com.transportplatform.tms.features.route.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import com.transportplatform.tms.features.route.domain.RouteStop;
import com.transportplatform.tms.features.route.domain.RouteStopRepository;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;

class RouteStopSequenceTest {

    @Test
    void persistsThroughUniqueTemporarySequencesBeforeApplyingNewOrder() {
        RouteStopRepository repository = mock(RouteStopRepository.class);
        List<List<Integer>> savedSequences = new ArrayList<>();
        doAnswer(invocation -> {
            List<RouteStop> stops = invocation.getArgument(0);
            savedSequences.add(stops.stream().map(RouteStop::getStopSequence).toList());
            return stops;
        }).when(repository).saveAll(anyList());

        RouteStopSequence.persist(repository, List.of(stop(3), stop(1), stop(2)));

        assertEquals(List.of(List.of(-1, -2, -3), List.of(1, 2, 3)), savedSequences);
        verify(repository, times(2)).flush();
    }

    private RouteStop stop(int sequence) {
        RouteStop routeStop = new RouteStop();
        routeStop.setStopSequence(sequence);
        return routeStop;
    }
}
