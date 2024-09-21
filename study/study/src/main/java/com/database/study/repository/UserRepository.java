package com.database.study.repository;

import com.database.study.entity.User;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
  boolean existsByUsername(String username);
  Optional<User> findByUsername(String username);
}