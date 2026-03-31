package com.transportplatform.tms.features.auth.domain;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AppUserRepository extends JpaRepository<AppUser, Long>, JpaSpecificationExecutor<AppUser> {

    @Query("""
            select user
            from AppUser user
            where lower(user.email) = lower(:email)
                and ((:tenantId is null and user.tenantId is null) or user.tenantId = :tenantId)
            """)
    Optional<AppUser> findForAuthentication(@Param("tenantId") String tenantId, @Param("email") String email);

    @Query("""
            select count(user) > 0
            from AppUser user
            where lower(user.email) = lower(:email)
                and ((:tenantId is null and user.tenantId is null) or user.tenantId = :tenantId)
            """)
    boolean existsForTenantAndEmail(@Param("tenantId") String tenantId, @Param("email") String email);

    @Query("""
            select count(user) > 0
            from AppUser user
            where lower(user.email) = lower(:email)
            and user.id <> :userId
            and ((:tenantId is null and user.tenantId is null) or user.tenantId = :tenantId)
            """)
    boolean existsForTenantAndEmailAndIdNot(@Param("tenantId") String tenantId, @Param("email") String email,
            @Param("userId") Long userId);

    long countByStatus(UserStatus status);

    long countByTenantId(String tenantId);

    long countByTenantIdAndStatus(String tenantId, UserStatus status);

    @Query("""
            select count(user)
            from AppUser user
            where user.status = :status
                and ((:tenantId is null and user.tenantId is null) or user.tenantId = :tenantId)
            """)
    long countByStatusAndTenantScope(@Param("status") UserStatus status, @Param("tenantId") String tenantId);

    @Query("""
            select count(distinct user)
            from AppUser user join user.roles role
            where role = :role
            """)
    long countByRole(@Param("role") RoleName role);

    @Query("""
            select count(distinct user)
            from AppUser user join user.roles role
            where role = :role
            and user.tenantId = :tenantId
            """)
    long countByRoleAndTenantScope(@Param("role") RoleName role, @Param("tenantId") String tenantId);
}
