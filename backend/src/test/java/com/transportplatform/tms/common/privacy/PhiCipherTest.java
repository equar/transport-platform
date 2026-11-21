package com.transportplatform.tms.common.privacy;

import static org.assertj.core.api.Assertions.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class PhiCipherTest {
  static final String OLD = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
      NEW = "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI=",
      LOOKUP = "AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE=";

  PhiCipher cipher() {
    return new PhiCipher("old:" + OLD, "old", LOOKUP, false);
  }

  @Test
  void randomizedAuthenticatedEncryptionAndNulls() {
    var c = cipher();
    String a = c.encrypt("Oxygen assistance, home address", "text"),
        b = c.encrypt("Oxygen assistance, home address", "text");
    assertThat(a).isNotEqualTo(b).doesNotContain("Oxygen");
    assertThat(c.decrypt(a, "text")).isEqualTo("Oxygen assistance, home address");
    assertThat(c.encrypt(null, "text")).isNull();
    assertThat(c.decrypt(null, "text")).isNull();
    assertThatThrownBy(() -> c.decrypt(a, "coordinate")).isInstanceOf(IllegalStateException.class);
    String altered = a.substring(0, a.length() - 4) + "AAAA";
    assertThatThrownBy(() -> c.decrypt(altered, "text")).isInstanceOf(IllegalStateException.class);
  }

  @Test
  void rejectsPlaintextMissingKeysAndUnknownKeyVersions() {
    var c = cipher();
    assertThatThrownBy(() -> c.decrypt("plain medical note", "text"))
        .isInstanceOf(IllegalStateException.class)
        .hasMessageNotContaining("medical note");
    assertThatThrownBy(() -> new PhiCipher("", "", LOOKUP, false))
        .isInstanceOf(IllegalStateException.class);
    var unknown = new PhiCipher("new:" + NEW, "new", LOOKUP, false);
    assertThatThrownBy(() -> unknown.decrypt(c.encrypt("note", "text"), "text"))
        .isInstanceOf(IllegalStateException.class);
  }

  @Test
  void readsOldKeysAndKeepsSearchIndexesStableDuringRotation() {
    var old = cipher();
    var rotated = new PhiCipher("new:" + NEW + ",old:" + OLD, "new", LOOKUP, false);
    assertThat(rotated.decrypt(old.encrypt("note", "text"), "text")).isEqualTo("note");
    assertThat(rotated.encrypt("note", "text")).startsWith("phi1.new.");
    assertThat(old.lookup("tenant-a", "wheelchair", "true"))
        .isEqualTo(rotated.lookup("tenant-a", "wheelchair", "true"))
        .isNotEqualTo(old.lookup("tenant-b", "wheelchair", "true"));
    assertThat(old.phoneTokens("tenant-a", "(555) 123-4567"))
        .contains(old.lookup("tenant-a", "phone", "1234567"))
        .doesNotContain("1234567");
  }

  @Test
  void minimizationPreservesLinkageAndFinancialFactsWithoutUnknownMedicalPayloads()
      throws Exception {
    var mapper = new ObjectMapper();
    var safe =
        PrivacyMinimizer.audit(
            mapper.readTree(
                "{\"riderId\":12,\"status\":\"ACTIVE\",\"amount\":25.50,\"dateOfBirth\":\"1960-01-01\",\"careNotesSummary\":\"Oxygen"
                    + " 2L\",\"unknownDiagnosisField\":\"medical"
                    + " diagnosis\",\"patient-private-name\":\"secret\"}"));
    assertThat(safe.path("riderId").asInt()).isEqualTo(12);
    assertThat(safe.path("amount").asDouble()).isEqualTo(25.5);
    assertThat(safe.path("careNotesSummary").asText()).isEqualTo("[REDACTED]");
    assertThat(safe.toString())
        .doesNotContain("Oxygen", "1960", "diagnosis", "patient-private-name");
  }
}
