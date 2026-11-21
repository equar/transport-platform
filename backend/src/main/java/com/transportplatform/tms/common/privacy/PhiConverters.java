package com.transportplatform.tms.common.privacy;

import com.transportplatform.tms.features.rider.domain.RiderMobilityNeed;
import jakarta.persistence.*;
import java.time.LocalDate;

public final class PhiConverters {
  private PhiConverters() {}

  @Converter
  public static class Text implements AttributeConverter<String, String> {
    private final PhiCipher crypto;

    public Text(PhiCipher crypto) {
      this.crypto = crypto;
    }

    public String convertToDatabaseColumn(String value) {
      return crypto.encrypt(value, "text");
    }

    public String convertToEntityAttribute(String value) {
      return crypto.decrypt(value, "text");
    }
  }

  @Converter
  public static class Date implements AttributeConverter<LocalDate, String> {
    private final PhiCipher crypto;

    public Date(PhiCipher crypto) {
      this.crypto = crypto;
    }

    public String convertToDatabaseColumn(LocalDate value) {
      return crypto.encrypt(value == null ? null : value.toString(), "date");
    }

    public LocalDate convertToEntityAttribute(String value) {
      String plain = crypto.decrypt(value, "date");
      return plain == null ? null : LocalDate.parse(plain);
    }
  }

  @Converter
  public static class Flag implements AttributeConverter<Boolean, String> {
    private final PhiCipher crypto;

    public Flag(PhiCipher crypto) {
      this.crypto = crypto;
    }

    public String convertToDatabaseColumn(Boolean value) {
      return crypto.encrypt(value == null ? null : value.toString(), "flag");
    }

    public Boolean convertToEntityAttribute(String value) {
      String plain = crypto.decrypt(value, "flag");
      if (plain == null) return false;
      if (plain.equalsIgnoreCase("true") || plain.equals("1")) return true;
      if (plain.equalsIgnoreCase("false") || plain.equals("0")) return false;
      throw new IllegalStateException("Invalid protected flag.");
    }
  }

  @Converter
  public static class Mobility implements AttributeConverter<RiderMobilityNeed, String> {
    private final PhiCipher crypto;

    public Mobility(PhiCipher crypto) {
      this.crypto = crypto;
    }

    public String convertToDatabaseColumn(RiderMobilityNeed value) {
      return crypto.encrypt(value == null ? null : value.name(), "mobility");
    }

    public RiderMobilityNeed convertToEntityAttribute(String value) {
      String plain = crypto.decrypt(value, "mobility");
      return plain == null ? null : RiderMobilityNeed.valueOf(plain);
    }
  }

  @Converter
  public static class Coordinate implements AttributeConverter<String, String> {
    private final PhiCipher crypto;

    public Coordinate(PhiCipher crypto) {
      this.crypto = crypto;
    }

    public String convertToDatabaseColumn(String value) {
      return crypto.encrypt(value, "coordinate");
    }

    public String convertToEntityAttribute(String value) {
      return crypto.decrypt(value, "coordinate");
    }
  }
}
