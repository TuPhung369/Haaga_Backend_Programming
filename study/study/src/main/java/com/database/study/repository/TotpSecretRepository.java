package com.database.study.repository;

import com.database.study.entity.TotpSecret;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TotpSecretRepository extends JpaRepository<TotpSecret, UUID> {
    Optional<TotpSecret> findByUsernameAndActive(String username, boolean active);
    List<TotpSecret> findAllByUsername(String username);
    List<TotpSecret> findAllByUsernameAndActive(String username, boolean active);
    void deleteByUsername(String username);
}