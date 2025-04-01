package com.database.study.repository;

import com.database.study.entity.LanguageSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LanguageSessionRepository extends JpaRepository<LanguageSession, String> {

  /**
   * Find all sessions for a specific user, ordered by creation date descending
   */
  Page<LanguageSession> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

  /**
   * Find the most recent session for a user
   */
  Optional<LanguageSession> findFirstByUserIdOrderByCreatedAtDesc(String userId);

  /**
   * Find all sessions for a user with a specific language
   */
  Page<LanguageSession> findByUserIdAndLanguageOrderByCreatedAtDesc(String userId, String language, Pageable pageable);
}