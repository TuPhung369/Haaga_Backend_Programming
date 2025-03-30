package com.database.study.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.database.study.entity.AssistantAIMessage;
import com.database.study.entity.User;

@Repository
public interface AssistantAIMessageRepository extends JpaRepository<AssistantAIMessage, Long> {

  List<AssistantAIMessage> findByUserOrderByTimestampAsc(User user);

  Page<AssistantAIMessage> findByUserOrderByTimestampDesc(User user, Pageable pageable);

  List<AssistantAIMessage> findByUserAndSessionIdOrderByTimestampAsc(User user, String sessionId);

  Page<AssistantAIMessage> findByUserAndSessionIdOrderByTimestampDesc(User user, String sessionId, Pageable pageable);

  void deleteByUser(User user);
}