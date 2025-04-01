package com.database.study.repository;

import com.database.study.entity.LanguageInteraction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LanguageInteractionRepository extends JpaRepository<LanguageInteraction, String> {

  /**
   * Find all interactions for a specific session, ordered by creation date
   */
  Page<LanguageInteraction> findBySessionIdOrderByCreatedAtAsc(String sessionId, Pageable pageable);
}