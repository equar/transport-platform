package com.transportplatform.tms.features.auth.application;

import com.transportplatform.tms.features.auth.domain.*;
import com.transportplatform.tms.features.notification.application.NotificationEmailSender;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Each new identity and its synchronous email are handled in one database transaction. */
@Service
public class DeploymentPlatformAdminBootstrapService {
    private static final Pattern EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final String CONSONANTS = "bcdfghjkmnprstvwz";
    private static final String VOWELS = "aeiou";
    private final SecureRandom random = new SecureRandom();
    private final AppUserRepository users;
    private final PasswordEncoder encoder;
    private final NotificationEmailSender mail;
    private final Clock clock;
    private final boolean emailEnabled;
    private final String provider;
    private final String loginUrl;

    public DeploymentPlatformAdminBootstrapService(AppUserRepository users, PasswordEncoder encoder,
            NotificationEmailSender mail, Clock clock,
            @Value("${app.email.enabled:false}") boolean emailEnabled,
            @Value("${app.email.provider:logging}") String provider,
            @Value("${app.auth.password-reset-base-url:http://localhost:3008/reset-password}") String resetUrl) {
        this.users = users; this.encoder = encoder; this.mail = mail; this.clock = clock;
        this.emailEnabled = emailEnabled; this.provider = provider;
        this.loginUrl = java.net.URI.create(resetUrl).resolve("/login").toString();
    }

    @Transactional
    public boolean bootstrap(String rawEmail) {
        String email = normalizeEmail(rawEmail);
        // Never promote, reactivate, reset, or resend an existing identity.
        if (users.findForAuthenticationByEmail(email).isPresent()) return false;
        if (!emailEnabled || !"microsoft-graph".equals(provider)) {
            throw new IllegalStateException("Administrator email bootstrap requires enabled Microsoft Graph email delivery.");
        }
        String password = generatePassword();
        AppUser admin = new AppUser();
        admin.setEmail(email);
        admin.setFirstName("System");
        admin.setLastName("Administrator");
        admin.setPasswordHash(encoder.encode(password));
        admin.setTenantId(null);
        admin.setStatus(UserStatus.ACTIVE);
        admin.setRoles(Set.of(RoleName.ROLE_PLATFORM_ADMIN));
        admin.setMustChangePassword(true);
        admin.setTemporaryPasswordExpiresAt(clock.instant().plus(Duration.ofHours(24)));
        users.saveAndFlush(admin);
        try {
            var result = mail.send(new NotificationEmailSender.NotificationEmailCommand(email,
                    "Your Transport system administrator account", "System administrator access",
                    String.join("\n", "Your Transport system administrator account is ready.",
                            "Sign in: " + loginUrl, "Email: " + email, "Temporary password: " + password, "",
                            "Sign in within 24 hours. You must choose a new password at first login.",
                            "If this password expires, use Forgot password on the sign-in page.")));
            if (result == null || !result.sent()) throw deliveryFailure();
        } catch (RuntimeException ignored) {
            // Never retain the provider exception: its text may include the password.
            throw deliveryFailure();
        }
        return true;
    }

    static String normalizeEmail(String value) {
        String email = value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
        if (email.length() > 150 || !EMAIL.matcher(email).matches()) {
            throw new IllegalArgumentException("Administrator bootstrap requires valid email addresses.");
        }
        return email;
    }

    String generatePassword() {
        StringBuilder password = new StringBuilder();
        for (int group = 0; group < 6; group++) {
            if (group > 0) password.append('-');
            for (int syllable = 0; syllable < 2; syllable++) {
                char consonant = CONSONANTS.charAt(random.nextInt(CONSONANTS.length()));
                password.append(syllable == 0 ? Character.toUpperCase(consonant) : consonant);
                password.append(VOWELS.charAt(random.nextInt(VOWELS.length())));
            }
        }
        password.append('-');
        for (int digit = 0; digit < 4; digit++) password.append(random.nextInt(8) + 2);
        return password.toString();
    }

    private IllegalStateException deliveryFailure() {
        return new IllegalStateException("Administrator email delivery failed; account creation rolled back. Check email provider configuration.");
    }
}
