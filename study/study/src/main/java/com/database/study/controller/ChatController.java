package com.database.study.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.database.study.dto.request.ChatMessageRequest;
import com.database.study.dto.response.ChatMessageResponse;
import com.database.study.service.ChatService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

  private final ChatService chatService;

  @GetMapping("/{userId}")
  public ResponseEntity<List<ChatMessageResponse>> getChatHistory(@PathVariable String userId) {
    return ResponseEntity.ok(chatService.getChatHistory(userId));
  }

  @PostMapping("/send")
  public ResponseEntity<ChatMessageResponse> sendMessage(@RequestBody ChatMessageRequest request) {
    return ResponseEntity.ok(chatService.sendMessage(request));
  }
}