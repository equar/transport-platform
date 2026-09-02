package com.transportplatform.tms.common.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.util.Collection;
import java.util.Date;
import java.util.LinkedHashSet;
import java.util.Set;
import javax.crypto.SecretKey;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private static final String ACCESS_TOKEN_TYPE = "ACCESS";
    private static final String REFRESH_TOKEN_TYPE = "REFRESH";

    private final SecurityProperties securityProperties;
    private final Clock clock;

    public JwtService(SecurityProperties securityProperties, Clock clock) {
        this.securityProperties = securityProperties;
        this.clock = clock;
    }

    public String generateAccessToken(AuthenticatedUser user) {
        return createToken(user, securityProperties.getJwt().getAccessTokenTtl(), ACCESS_TOKEN_TYPE);
    }

    public String generateRefreshToken(AuthenticatedUser user) {
        return createToken(user, securityProperties.getJwt().getRefreshTokenTtl(), REFRESH_TOKEN_TYPE);
    }

    public JwtClaims parseAccessToken(String token) {
        JwtClaims claims = parseToken(token);
        if (!ACCESS_TOKEN_TYPE.equals(claims.tokenType())) {
            throw new JwtException("Token is not an access token.");
        }
        return claims;
    }

    public JwtClaims parseRefreshToken(String token) {
        JwtClaims claims = parseToken(token);
        if (!REFRESH_TOKEN_TYPE.equals(claims.tokenType())) {
            throw new JwtException("Token is not a refresh token.");
        }
        return claims;
    }

    private JwtClaims parseToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(signingKey())
                .requireIssuer(securityProperties.getJwt().getIssuer())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        Collection<?> rawRoles = claims.get("roles", Collection.class);
        return new JwtClaims(
                claims.get("userId", Long.class),
                claims.getSubject(),
                claims.get("firstName", String.class),
                claims.get("lastName", String.class),
                claims.get("tenantId", String.class),
                extractParsedRoles(rawRoles),
                claims.get("mustChangePassword", Boolean.class),
                claims.get("tokenType", String.class),
                claims.getIssuedAt().toInstant(),
                claims.getExpiration().toInstant());
    }

    private String createToken(AuthenticatedUser user, java.time.Duration ttl, String tokenType) {
        Instant now = clock.instant();
        return Jwts.builder()
                .subject(user.getUsername())
                .issuer(securityProperties.getJwt().getIssuer())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(ttl)))
                .claim("userId", user.id())
                .claim("firstName", user.firstName())
                .claim("lastName", user.lastName())
                .claim("tenantId", user.tenantId())
                .claim("roles", extractRoles(user.getAuthorities()))
                .claim("mustChangePassword", user.mustChangePassword())
                .claim("tokenType", tokenType)
                .signWith(signingKey())
                .compact();
    }

    private Set<String> extractRoles(Collection<? extends GrantedAuthority> authorities) {
        Set<String> roles = new LinkedHashSet<>();
        for (GrantedAuthority authority : authorities) {
            roles.add(authority.getAuthority());
        }
        return roles;
    }

    private Set<String> extractParsedRoles(Collection<?> rawRoles) {
        Set<String> roles = new LinkedHashSet<>();
        if (rawRoles == null) {
            return roles;
        }
        for (Object rawRole : rawRoles) {
            if (rawRole instanceof String role && !role.isBlank()) {
                roles.add(role);
            }
        }
        return roles;
    }

    private SecretKey signingKey() {
        return Keys.hmacShaKeyFor(securityProperties.getJwt().getSecret().getBytes(StandardCharsets.UTF_8));
    }
}
