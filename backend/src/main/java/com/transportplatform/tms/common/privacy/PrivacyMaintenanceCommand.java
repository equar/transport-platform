package com.transportplatform.tms.common.privacy;

import com.fasterxml.jackson.databind.*;
import java.io.*;
import java.sql.*;
import java.util.*;
import org.flywaydb.core.Flyway;

/** Offline maintenance entry point. Never starts HTTP, schedulers, or delivery workers. */
public final class PrivacyMaintenanceCommand {
  record Field(String table, String column, String context) {}

  static List<Field> fields() {
    try (var in = PrivacyMaintenanceCommand.class.getResourceAsStream("/privacy-columns.csv");
        var reader =
            new BufferedReader(
                new InputStreamReader(
                    Objects.requireNonNull(in), java.nio.charset.StandardCharsets.UTF_8))) {
      return reader
          .lines()
          .skip(1)
          .map(
              line -> {
                var p = line.split(",");
                return new Field(p[0], p[1], p[2]);
              })
          .toList();
    } catch (IOException e) {
      throw new IllegalStateException("Privacy inventory unavailable.");
    }
  }

  public static void main(String[] args) throws Exception {
    boolean apply = Arrays.asList(args).contains("--apply"),
        demo = Arrays.asList(args).contains("--demo-data");
    if (Arrays.stream(args)
        .anyMatch(a -> !Set.of("--apply", "--dry-run", "--demo-data").contains(a)))
      throw new IllegalArgumentException(
          "Use --dry-run or --apply; --demo-data is for disposable development databases only.");
    if (apply && Arrays.asList(args).contains("--dry-run"))
      throw new IllegalArgumentException("Choose --apply or --dry-run, never both.");
    var env = System.getenv();
    var crypto =
        new PhiCipher(
            required(env, "APP_PRIVACY_ENCRYPTION_KEYS"),
            required(env, "APP_PRIVACY_ACTIVE_KEY_ID"),
            required(env, "APP_PRIVACY_LOOKUP_KEY"),
            false);
    String url = required(env, "SPRING_DATASOURCE_URL"),
        user = required(env, "SPRING_DATASOURCE_USERNAME"),
        password = required(env, "SPRING_DATASOURCE_PASSWORD");
    if (apply)
      Flyway.configure()
          .dataSource(url, user, password)
          .locations(
              demo
                  ? new String[] {"classpath:db/migration", "classpath:db/devdata"}
                  : new String[] {"classpath:db/migration"})
          .load()
          .migrate();
    try (Connection db = DriverManager.getConnection(url, user, password)) {
      db.setAutoCommit(false);
      run(db, crypto, apply);
    }
  }

  public static String inventoryHash() {
    try (var in = PrivacyMaintenanceCommand.class.getResourceAsStream("/privacy-columns.csv")) {
      return java.util.HexFormat.of()
          .formatHex(
              java.security.MessageDigest.getInstance("SHA-256")
                  .digest(java.util.Objects.requireNonNull(in).readAllBytes()));
    } catch (Exception e) {
      throw new IllegalStateException("Privacy inventory unavailable.");
    }
  }

  static String required(Map<String, String> env, String key) {
    String value = env.get(key);
    if (value == null || value.isBlank())
      throw new IllegalStateException("Required environment setting missing: " + key);
    return value;
  }

  public static void run(Connection db, PhiCipher crypto, boolean apply) throws Exception {
    Map<String, List<Field>> groups = new LinkedHashMap<>();
    for (var f : fields()) groups.computeIfAbsent(f.table(), ignored -> new ArrayList<>()).add(f);
    for (var entry : groups.entrySet()) {
      String table = entry.getKey();
      if (query(
              db,
              "SELECT COUNT(*) AS matches_table FROM information_schema.tables WHERE"
                  + " table_schema=DATABASE() AND table_name=?",
              table)
          .getFirst()
          .get("matches_table")
          .toString()
          .equals("0")) {
        if (!apply) {
          System.out.println("DRY RUN " + table + ": pending schema migration");
          continue;
        }
        throw new IllegalStateException("Privacy inventory table is missing.");
      }
      String key = table.equals("rider_mobility_needs") ? "rider_id" : primaryKey(db, table);
      Object cursor = null;
      long checked = 0, changed = 0;
      while (true) {
        List<Map<String, Object>> batch =
            query(
                db,
                "SELECT * FROM "
                    + table
                    + (cursor == null ? "" : " WHERE " + key + ">?")
                    + " ORDER BY "
                    + key
                    + " LIMIT "
                    + (table.equals("report_export_jobs") ? 1 : 200),
                cursor == null ? new Object[] {} : new Object[] {cursor});
        if (batch.isEmpty()) break;
        // Process all collection rows for each rider, without paging through a rewritten ciphertext
        // key.
        if (table.equals("rider_mobility_needs")) {
          var ids = new LinkedHashSet<Object>();
          for (var row : batch) ids.add(row.get(key));
          batch = new ArrayList<>();
          for (var id : ids)
            batch.addAll(query(db, "SELECT * FROM " + table + " WHERE rider_id=?", id));
        }
        for (var row : batch) {
          cursor = row.get(key);
          checked++;
          Map<String, Object> updates = new LinkedHashMap<>();
          if (table.equals("notifications")) {
            updates.put("created_by", "system");
            updates.put("updated_by", "system");
            boolean setup = PrivacyMinimizer.accountSetup((String) row.get("notification_type"));
            if (!setup) {
              updates.put(
                  "title",
                  PrivacyMinimizer.notificationTitle((String) row.get("notification_type")));
              updates.put(
                  "email_subject",
                  PrivacyMinimizer.notificationTitle((String) row.get("notification_type")));
              row.put("message", PrivacyMinimizer.NOTICE);
              var raw = plain(crypto, row.get("metadata_json"), "text");
              Map<String, Object> metadata = Map.of();
              try {
                if (raw != null) metadata = new ObjectMapper().readValue(raw, Map.class);
              } catch (Exception ignored) {
              }
              row.put(
                  "metadata_json",
                  new ObjectMapper()
                      .writeValueAsString(PrivacyMinimizer.notificationMetadata(metadata)));
              row.put("error_message", row.get("error_message") == null ? null : "DELIVERY_FAILED");
            }
          }
          for (var f : entry.getValue()) {
            Object raw = row.get(f.column());
            if (raw == null) continue;
            String text = raw.toString();
            String value = plain(crypto, raw, f.context());
            if (f.context().equals("flag")) value = Boolean.toString(flag(value));
            if (!crypto.current(text)) updates.put(f.column(), crypto.encrypt(value, f.context()));
          }
          // The in-memory minimization above must also replace already-encrypted notification
          // content.
          if (table.equals("notifications")
              && !PrivacyMinimizer.accountSetup((String) row.get("notification_type")))
            for (String col : List.of("message", "metadata_json", "error_message"))
              if (row.get(col) != null)
                updates.put(col, crypto.encrypt(plain(crypto, row.get(col), "text"), "text"));
          if (table.equals("riders") && apply) {
            String tenant = (String) row.get("tenant_id");
            boolean wheelchair = flag(plain(crypto, row.get("wheelchair_required"), "flag")),
                escort = flag(plain(crypto, row.get("escort_required"), "flag"));
            updates.put(
                "wheelchair_lookup",
                crypto.lookup(tenant, "wheelchair", Boolean.toString(wheelchair)));
            updates.put("escort_lookup", crypto.lookup(tenant, "escort", Boolean.toString(escort)));
            execute(db, "DELETE FROM rider_private_search_tokens WHERE rider_id=?", row.get("id"));
            for (String token :
                crypto.phoneTokens(
                    tenant,
                    plain(crypto, row.get("primary_phone"), "text"),
                    plain(crypto, row.get("alternate_phone"), "text")))
              execute(
                  db,
                  "INSERT INTO rider_private_search_tokens(rider_id,token) VALUES(?,?)",
                  row.get("id"),
                  token);
          }
          if (!updates.isEmpty()) {
            changed++;
            if (apply) {
              String sql =
                  "UPDATE "
                      + table
                      + " SET "
                      + String.join(",", updates.keySet().stream().map(c -> c + "=?").toList())
                      + " WHERE "
                      + key
                      + "=?";
              List<Object> values = new ArrayList<>(updates.values());
              values.add(row.get(key));
              if (table.equals("rider_mobility_needs")) {
                sql += " AND mobility_need=?";
                values.add(row.get("mobility_need"));
              }
              execute(db, sql, values.toArray());
            }
          }
        }
        if (apply) db.commit();
        else db.rollback();
      }
      System.out.println(
          (apply ? "PROTECTED " : "DRY RUN ")
              + table
              + ": scanned="
              + checked
              + ", candidates="
              + changed);
    }
    if (!query(
            db,
            "SELECT table_name FROM information_schema.tables WHERE table_schema=DATABASE() AND"
                + " table_name='audit_logs'")
        .isEmpty()) scrubAudits(db, apply);
    else if (!apply) System.out.println("DRY RUN audit_logs: pending schema migration");
    else throw new IllegalStateException("Audit schema missing after migration.");
    if (apply) {
      execute(
          db,
          "INSERT INTO privacy_protection_state(id,protected_at,inventory_hash)"
              + " VALUES(1,UTC_TIMESTAMP(6),?) ON DUPLICATE KEY UPDATE"
              + " protected_at=VALUES(protected_at),inventory_hash=VALUES(inventory_hash)",
          inventoryHash());
      db.commit();
    }
  }

  static String primaryKey(Connection db, String table) throws Exception {
    try (var rs = db.getMetaData().getPrimaryKeys(db.getCatalog(), null, table)) {
      List<String> names = new ArrayList<>();
      while (rs.next()) names.add(rs.getString("COLUMN_NAME"));
      if (names.size() != 1 || !names.getFirst().matches("[a-z_]+"))
        throw new IllegalStateException("Unsupported privacy inventory primary key.");
      return names.getFirst();
    }
  }

  static boolean flag(String value) {
    if ("1".equals(value) || "true".equalsIgnoreCase(value)) return true;
    if ("0".equals(value) || "false".equalsIgnoreCase(value)) return false;
    throw new IllegalStateException(
        "Invalid legacy sensitive flag. Review the source record; values are omitted.");
  }

  static String plain(PhiCipher c, Object raw, String context) {
    if (raw == null) return null;
    String value = raw.toString();
    return c.encrypted(value) ? c.decrypt(value, context) : value;
  }

  static void scrubAudits(Connection db, boolean apply) throws Exception {
    Object cursor = 0L;
    long count = 0;
    ObjectMapper mapper = new ObjectMapper();
    while (true) {
      var batch = query(db, "SELECT * FROM audit_logs WHERE id>? ORDER BY id LIMIT 200", cursor);
      if (batch.isEmpty()) break;
      for (var row : batch) {
        cursor = row.get("id");
        count++;
        if (apply)
          execute(
              db,
              "UPDATE audit_logs SET"
                  + " old_value_json=?,new_value_json=?,summary=?,actor_email=NULL,actor_name=?,created_by=?,updated_by=?"
                  + " WHERE id=?",
              PrivacyMinimizer.auditJson(mapper, (String) row.get("old_value_json")),
              PrivacyMinimizer.auditNewJson(
                  mapper, (String) row.get("old_value_json"), (String) row.get("new_value_json")),
              PrivacyMinimizer.summary(
                  (String) row.get("entity_type"), (String) row.get("action_name")),
              row.get("actor_user_id") == null ? "System" : "User #" + row.get("actor_user_id"),
              row.get("actor_user_id") == null ? "system" : "user:" + row.get("actor_user_id"),
              row.get("actor_user_id") == null ? "system" : "user:" + row.get("actor_user_id"),
              cursor);
      }
      if (apply) db.commit();
      else db.rollback();
    }
    System.out.println((apply ? "MINIMIZED " : "DRY RUN ") + "audit_logs: scanned=" + count);
  }

  static List<Map<String, Object>> query(Connection db, String sql, Object... values)
      throws Exception {
    try (var p = db.prepareStatement(sql)) {
      for (int i = 0; i < values.length; i++) p.setObject(i + 1, values[i]);
      try (var rs = p.executeQuery()) {
        List<Map<String, Object>> rows = new ArrayList<>();
        while (rs.next()) {
          Map<String, Object> row = new LinkedHashMap<>();
          for (int i = 1; i <= rs.getMetaData().getColumnCount(); i++)
            row.put(rs.getMetaData().getColumnLabel(i), rs.getObject(i));
          rows.add(row);
        }
        return rows;
      }
    }
  }

  static void execute(Connection db, String sql, Object... values) throws Exception {
    try (var p = db.prepareStatement(sql)) {
      for (int i = 0; i < values.length; i++) p.setObject(i + 1, values[i]);
      p.executeUpdate();
    }
  }
}
