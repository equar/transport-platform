package com.transportplatform.tms.features.auth.domain;

import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AuthRefreshSessionRepository extends JpaRepository<AuthRefreshSession, Long> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    Optional<AuthRefreshSession> findByTokenHash(String tokenHash);

    @Modifying
    @Query("update AuthRefreshSession s set s.revokedAt = :now "
            + "where s.familyId = :familyId and s.revokedAt is null")
    int revokeFamily(@Param("familyId") String familyId, @Param("now") Instant now);

    @Modifying(flushAutomatically = true)
    @Query("update AuthRefreshSession s set s.revokedAt = :now "
            + "where s.user.id = :userId and s.revokedAt is null")
    int revokeAllForUser(@Param("userId") Long userId, @Param("now") Instant now);

    @Modifying(flushAutomatically = true)
    @Query("update AuthRefreshSession s set s.revokedAt = :now "
            + "where s.user.id = :userId and s.clientType = 'WEB' and s.revokedAt is null")
    int revokeWebForUser(@Param("userId") Long userId, @Param("now") Instant now);

    @Modifying
    @Query("update AuthRefreshSession s set s.revokedAt = :now "
            + "where s.user.tenantId = :tenantId and s.revokedAt is null")
    int revokeAllForTenant(@Param("tenantId") String tenantId, @Param("now") Instant now);
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update AppUser u set u.securityVersion = u.securityVersion + 1 where u.id = :userId")
    int invalidateUserAccess(@Param("userId") Long userId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update AppUser u set u.securityVersion = u.securityVersion + 1 where u.tenantId = :tenantId")
    int invalidateTenantAccess(@Param("tenantId") String tenantId);
}
