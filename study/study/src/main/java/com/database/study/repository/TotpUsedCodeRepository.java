package com.database.study.repository;

import com.database.study.entity.TotpUsedCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Repository
public interface TotpUsedCodeRepository extends JpaRepository<TotpUsedCode, UUID> {
    boolean existsByUsernameAndCodeAndTimeWindow(String username, String code, long timeWindow);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM TotpUsedCode t WHERE t.usedAt < ?1")
    int deleteByUsedAtBefore(LocalDateTime dateTime);
}