package com.database.study.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.database.study.dto.request.ChatMessageRequest;
import com.database.study.dto.response.ChatMessageResponse;
import com.database.study.service.ChatMessageService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
@Slf4j
public class ChatMessageController {
    
    private final ChatMessageService messageService;
    
    @PostMapping
    public ResponseEntity<ChatMessageResponse> sendMessage(@Valid @RequestBody ChatMessageRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userId = auth.getName();
        
        log.info("Sending message from user {} to {}", userId, request.getReceiverId());
        ChatMessageResponse response = messageService.sendMessage(userId, request);
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/conversation/{otherUserId}")
    public ResponseEntity<Page<ChatMessageResponse>> getMessagesBetweenUsers(
            @PathVariable String otherUserId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userId = auth.getName();
        
        log.info("Getting messages between users {} and {}", userId, otherUserId);
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("timestamp").descending());
        Page<ChatMessageResponse> messages = messageService.getMessagesBetweenUsers(userId, otherUserId, pageable);
        
        return ResponseEntity.ok(messages);
    }
    
    @GetMapping("/conversation/id/{conversationId}")
    public ResponseEntity<Page<ChatMessageResponse>> getMessagesByConversationId(
            @PathVariable String conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("Getting messages for conversation {}", conversationId);
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("timestamp").descending());
        Page<ChatMessageResponse> messages = messageService.getMessagesByConversationId(conversationId, pageable);
        
        return ResponseEntity.ok(messages);
    }
    
    @PutMapping("/read/{conversationId}")
    public ResponseEntity<Void> markMessagesAsRead(@PathVariable String conversationId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userId = auth.getName();
        
        log.info("Marking messages as read for user {} in conversation {}", userId, conversationId);
        messageService.markMessagesAsRead(userId, conversationId);
        
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/latest")
    public ResponseEntity<List<ChatMessageResponse>> getLatestMessagesForUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userId = auth.getName();
        
        log.info("Getting latest messages for user {}", userId);
        List<ChatMessageResponse> latestMessages = messageService.getLatestMessagesForUser(userId);
        
        return ResponseEntity.ok(latestMessages);
    }
    
    @GetMapping("/unread/count")
    public ResponseEntity<Integer> getUnreadMessageCount() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userId = auth.getName();
        
        log.info("Getting unread message count for user {}", userId);
        int unreadCount = messageService.getUnreadMessageCount(userId);
        
        return ResponseEntity.ok(unreadCount);
    }
    
    @GetMapping("/unread/count/{senderId}")
    public ResponseEntity<Integer> getUnreadMessageCountFromUser(@PathVariable String senderId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userId = auth.getName();
        
        log.info("Getting unread message count from user {} for user {}", senderId, userId);
        int unreadCount = messageService.getUnreadMessageCountFromUser(userId, senderId);
        
        return ResponseEntity.ok(unreadCount);
    }
}
