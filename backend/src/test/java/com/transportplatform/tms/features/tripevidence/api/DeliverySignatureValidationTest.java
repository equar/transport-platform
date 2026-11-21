package com.transportplatform.tms.features.tripevidence.api;

import static com.transportplatform.tms.features.tripevidence.api.TripEvidenceRecords.*;
import static org.assertj.core.api.Assertions.assertThat;

import jakarta.validation.Validation;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.Test;

class DeliverySignatureValidationTest {
  @Test
  void rejectsBlankOutOfBoundsAndOversizedInkAtTheRequestBoundary() {
    var line = List.of(new Point(0.1, 0.2), new Point(0.8, 0.7));
    var invalid = List.of(
        new Signature(List.of()),
        new Signature(List.of(List.of(new Point(0, 0), new Point(0, 0)))),
        new Signature(List.of(List.of(new Point(-0.1, 0.2), new Point(0.8, 0.7)))),
        new Signature(List.of(List.of(new Point(Double.NaN, 0.2), new Point(0.8, 0.7)))),
        new Signature(Collections.nCopies(33, line)),
        new Signature(List.of(Collections.nCopies(501, new Point(0.1, 0.2)))),
        new Signature(Collections.nCopies(3, Collections.nCopies(400, new Point(0.1, 0.2)))));
    try (var factory = Validation.buildDefaultValidatorFactory()) {
      var validator = factory.getValidator();
      for (var signature : invalid)
        assertThat(validator.validate(new Confirmation(1L, true, signature))).isNotEmpty();
      assertThat(validator.validate(new Confirmation(1L, true, new Signature(List.of(line))))).isEmpty();
      assertThat(validator.validate(new Confirmation(1L, true))).isEmpty();
    }
  }
}
