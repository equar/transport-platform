package com.transportplatform.tms.features.notification.application;

import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

@Component
public class NotificationEmailHtmlRenderer {

    private static final Pattern URL_PATTERN = Pattern.compile("(https?://[^\\s<]+)");

    public String render(String title, String body) {
        String safeTitle = escapeHtml(title);
        String safeBody = formatBody(body);
        return "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\">"
                + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">"
            + "</head><body style=\"margin:0;padding:0;background:#f6f8fc;color:#102347;\">"
                + "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" style=\"background:#f6f8fc;\"><tr><td align=\"center\" style=\"padding:32px 16px;\">"
                + "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" style=\"max-width:600px;background:#ffffff;border:1px solid #dce5f1;\">"
                + "<tr><td style=\"padding:24px 32px;background:#084aa8;color:#ffffff;font-family:Arial,sans-serif;\">"
                + "<div style=\"font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#c6dcfb;\">Transport Platform</div>"
                + "<div style=\"margin-top:6px;font-size:20px;font-weight:700;line-height:1.3;\">Operations update</div>"
                + "</td></tr><tr><td style=\"padding:32px;font-family:Arial,sans-serif;\">"
                + "<h1 style=\"margin:0 0 16px;font-size:24px;line-height:1.3;color:#102347;\">" + safeTitle + "</h1>"
                + "<div style=\"font-size:16px;line-height:1.6;color:#5c6f8f;\">" + safeBody + "</div>"
                + "</td></tr><tr><td style=\"padding:20px 32px;border-top:1px solid #dce5f1;font-family:Arial,sans-serif;font-size:12px;line-height:1.5;color:#5c6f8f;\">"
                + "This is an automated Transport Platform notification. Please do not reply to this email."
                + "</td></tr></table></td></tr></table></body></html>";
    }

    private String formatBody(String value) {
        String escaped = escapeHtml(value).replace("\r\n", "\n").replace("\r", "\n");
        Matcher matcher = URL_PATTERN.matcher(escaped);
        StringBuffer output = new StringBuffer();
        while (matcher.find()) {
            String url = matcher.group(1);
            String link = "<a href=\"" + url + "\" style=\"color:#1266d6;font-weight:700;text-decoration:underline;\">"
                    + url + "</a>";
            matcher.appendReplacement(output, Matcher.quoteReplacement(link));
        }
        matcher.appendTail(output);
        return output.toString().replace("\n", "<br>");
    }

    private String escapeHtml(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}