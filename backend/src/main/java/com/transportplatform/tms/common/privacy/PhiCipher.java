package com.transportplatform.tms.common.privacy;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.util.*;
import javax.crypto.*;
import javax.crypto.spec.*;

/** Versioned, randomized authenticated encryption. Keys are supplied outside the database. */
public final class PhiCipher {
  private final Map<String, byte[]> keys = new HashMap<>();
  private final String active;
  private final byte[] searchKey;
  private final boolean legacy;
  private final SecureRandom random = new SecureRandom();

  public PhiCipher(String ring, String active, String lookupKey, boolean legacy) {
    this.active = active;
    this.legacy = legacy;
    try {
      for (String entry : ring.split(",")) {
        String[] pair = entry.trim().split(":", 2);
        if (pair.length != 2
            || !pair[0].matches("[A-Za-z0-9_-]{1,32}")
            || keys.put(pair[0], decode(pair[1])) != null) throw new IllegalArgumentException();
      }
      searchKey = decode(lookupKey);
      if (!keys.containsKey(active)
          || keys.values().stream().anyMatch(key -> java.util.Arrays.equals(key, searchKey)))
        throw new IllegalArgumentException();
    } catch (RuntimeException e) {
      throw new IllegalStateException(
          "Configure APP_PRIVACY_ENCRYPTION_KEYS (key-id:base64), APP_PRIVACY_ACTIVE_KEY_ID and"
              + " APP_PRIVACY_LOOKUP_KEY with independent 32-byte keys.");
    }
  }

  private byte[] decode(String value) {
    byte[] b = Base64.getDecoder().decode(value);
    if (b.length != 32) throw new IllegalArgumentException();
    return b;
  }

  public boolean encrypted(String value) {
    return value != null && value.startsWith("phi1.");
  }

  public boolean current(String value) {
    return value != null && value.startsWith("phi1." + active + ".");
  }

  public String encrypt(String value, String context) {
    if (value == null) return null;
    try {
      byte[] nonce = new byte[12];
      random.nextBytes(nonce);
      Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
      c.init(
          Cipher.ENCRYPT_MODE,
          new SecretKeySpec(keys.get(active), "AES"),
          new GCMParameterSpec(128, nonce));
      c.updateAAD(("phi1|" + active + "|" + context).getBytes(StandardCharsets.UTF_8));
      byte[] sealed = c.doFinal(value.getBytes(StandardCharsets.UTF_8));
      return "phi1."
          + active
          + "."
          + Base64.getEncoder()
              .encodeToString(
                  ByteBuffer.allocate(12 + sealed.length).put(nonce).put(sealed).array());
    } catch (GeneralSecurityException e) {
      throw failure();
    }
  }

  public String decrypt(String value, String context) {
    if (value == null) return null;
    if (!encrypted(value)) {
      if (legacy) return value;
      throw new IllegalStateException(
          "Unprotected sensitive data found. Run the offline privacy maintenance command before"
              + " serving traffic.");
    }
    try {
      String[] parts = value.split("\\.", 3);
      byte[] key = keys.get(parts[1]);
      if (key == null) throw new GeneralSecurityException();
      byte[] bytes = Base64.getDecoder().decode(parts[2]);
      if (bytes.length < 28) throw new GeneralSecurityException();
      Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
      c.init(
          Cipher.DECRYPT_MODE,
          new SecretKeySpec(key, "AES"),
          new GCMParameterSpec(128, Arrays.copyOf(bytes, 12)));
      c.updateAAD(("phi1|" + parts[1] + "|" + context).getBytes(StandardCharsets.UTF_8));
      return new String(c.doFinal(bytes, 12, bytes.length - 12), StandardCharsets.UTF_8);
    } catch (GeneralSecurityException | RuntimeException e) {
      throw failure();
    }
  }

  public String lookup(String tenant, String field, String value) {
    try {
      Mac mac = Mac.getInstance("HmacSHA256");
      mac.init(new SecretKeySpec(searchKey, "HmacSHA256"));
      return HexFormat.of()
          .formatHex(
              mac.doFinal((tenant + "|" + field + "|" + value).getBytes(StandardCharsets.UTF_8)));
    } catch (GeneralSecurityException e) {
      throw failure();
    }
  }

  /** Domain-separated integrity key derived from the independent, stable lookup secret. */
  public String auditSignature(String message) {
    try {
      Mac derive=Mac.getInstance("HmacSHA256");derive.init(new SecretKeySpec(searchKey,"HmacSHA256"));
      byte[] auditKey=derive.doFinal("bakaroo:audit-integrity:v1".getBytes(StandardCharsets.UTF_8));
      Mac mac=Mac.getInstance("HmacSHA256");mac.init(new SecretKeySpec(auditKey,"HmacSHA256"));
      return HexFormat.of().formatHex(mac.doFinal(message.getBytes(StandardCharsets.UTF_8)));
    } catch(GeneralSecurityException e) { throw failure(); }
  }

  public Set<String> phoneTokens(String tenant, String... phones) {
    Set<String> tokens = new LinkedHashSet<>();
    for (String phone : phones) {
      if (phone == null) continue;
      String digits = phone.replaceAll("[^0-9]", "");
      for (int i = 0; i < digits.length(); i++)
        for (int end = i + 3; end <= Math.min(digits.length(), i + 30); end++)
          tokens.add(lookup(tenant, "phone", digits.substring(i, end)));
    }
    return tokens;
  }

  public boolean legacyAllowed() {
    return legacy;
  }

  private IllegalStateException failure() {
    return new IllegalStateException(
        "Sensitive data could not be authenticated or decrypted. Check the configured key ring;"
            + " data values are not logged.");
  }
}
