package com.transportplatform.tms.features.auth.domain;

import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AuthRefreshSessionRepository extends JpaRepository<AuthRefreshSession, Long> {
    Optional<AuthRefreshSession> findByTokenHash(String tokenHash);

    @Modifying
    @Query("update AuthRefreshSession s set s.revokedAt = :now "
            + "where s.familyId = :familyId and s.revokedAt is null")
    int revokeFamily(@Param("familyId") String familyId, @Param("now") Instant now);

    @Modifying
    @Query("update AuthRefreshSession s set s.revokedAt = :now "
            + "where s.user.id = :userId and s.revokedAt is null")
    int revokeAllForUser(@Param("userId") Long userId, @Param("now") Instant now);
}

