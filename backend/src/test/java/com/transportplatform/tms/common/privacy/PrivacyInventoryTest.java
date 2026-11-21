package com.transportplatform.tms.common.privacy;

import static org.assertj.core.api.Assertions.*;

import jakarta.persistence.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

class PrivacyInventoryTest {
  @Test
  void everyProtectedEntityColumnHasAnOfflineMigrationRecipe() throws Exception {
    Map<String, String> actual = new TreeMap<>();
    for (var field : PrivacyMaintenanceCommand.fields()) {
      assertThat(actual.put(field.table() + "." + field.column(), field.context())).isNull();
    }
    var resources =
        new PathMatchingResourcePatternResolver()
            .getResources("classpath*:com/transportplatform/tms/features/**/domain/*.class");
    Set<String> expected = new HashSet<>();
    for (var resource : resources) {
      String path = resource.getURL().toString();
      int start = path.indexOf("com/transportplatform/tms/");
      if (start < 0) continue;
      Class<?> type = Class.forName(path.substring(start, path.length() - 6).replace('/', '.'));
      Table table = type.getAnnotation(Table.class);
      if (table == null) continue;
      for (var field : type.getDeclaredFields()) {
        Convert converter = field.getAnnotation(Convert.class);
        if (converter == null
            || !converter.converter().getName().startsWith(PhiConverters.class.getName())) continue;
        String context =
            switch (converter.converter().getSimpleName()) {
              case "Text" -> "text";
              case "Date" -> "date";
              case "Flag" -> "flag";
              case "Mobility" -> "mobility";
              case "Coordinate" -> "coordinate";
              default -> throw new IllegalStateException();
            };
        Column column = field.getAnnotation(Column.class);
        CollectionTable collection = field.getAnnotation(CollectionTable.class);
        String key = (collection == null ? table.name() : collection.name()) + "." + column.name();
        assertThat(actual).containsEntry(key, context);
        expected.add(key);
      }
    }
    expected.addAll(
        List.of(
            "trip_verified_stops.pickup_latitude",
            "trip_verified_stops.pickup_longitude",
            "trip_verified_stops.dropoff_latitude",
            "trip_verified_stops.dropoff_longitude",
            "report_export_jobs.result_csv",
            "report_export_jobs.request_json"));
    assertThat(actual.keySet()).containsExactlyInAnyOrderElementsOf(expected);
  }
}
