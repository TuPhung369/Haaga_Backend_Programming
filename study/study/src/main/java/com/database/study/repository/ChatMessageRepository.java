package com.database.study.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.database.study.entity.ChatMessage;
import com.database.study.entity.User;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

  List<ChatMessage> findByUserOrderByTimestampAsc(User user);

  List<ChatMessage> findByUserAndSessionIdOrderByTimestampAsc(User user, String sessionId);

  void deleteByUser(User user);
}