package com.transportplatform.tms.features.auth.domain;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    @Query("""
            select token
            from PasswordResetToken token
            where token.user.id = :userId
                and token.usedAt is null
                and token.expiresAt > :now
            """)
    List<PasswordResetToken> findActiveTokensForUser(@Param("userId") Long userId, @Param("now") Instant now);
}