package com.database.study.repository;

import com.database.study.entity.User;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
  boolean existsByUsername(String username);
  boolean existsByUsernameIgnoreCase(String username);
  boolean existsByEmail(String email);

  Optional<User> findByUsername(String username);
  Optional<User> findByEmail(String email);
  

  @Modifying
  @Query(value = "DELETE FROM user_roles WHERE user_id = :userId", nativeQuery = true)
  void deleteUserRolesByUserId(@Param("userId") UUID userId);
}