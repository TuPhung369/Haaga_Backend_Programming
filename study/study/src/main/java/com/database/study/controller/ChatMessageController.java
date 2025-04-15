package com.database.study.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

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
import com.database.study.entity.User;
import com.database.study.exception.AppException;
import com.database.study.exception.ErrorCode;
import com.database.study.repository.UserRepository;
import com.database.study.service.ChatMessageService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
@Slf4j
public class ChatMessageController {

    private final ChatMessageService messageService;
    private final UserRepository userRepository;

    @PostMapping("/message-service/send")
    public ResponseEntity<ChatMessageResponse> sendMessage(@Valid @RequestBody ChatMessageRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        log.info("Sending message from user {} to {}", username, request.getReceiverId());
        ChatMessageResponse response = messageService.sendMessage(username, request);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/messages")
    public ResponseEntity<ChatMessageResponse> sendMessageAlternative(@Valid @RequestBody ChatMessageRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        log.info("Sending message from user {} to {}", username, request.getReceiverId());
        ChatMessageResponse response = messageService.sendMessage(username, request);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/messages/{contactId}")
    public ResponseEntity<List<ChatMessageResponse>> getMessages(@PathVariable String contactId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        log.info("Getting messages between user {} and contact {}", username, contactId);

        // Use the existing service method but convert Page to List
        Page<ChatMessageResponse> messagesPage = messageService.getMessagesBetweenUsers(
            username, contactId, Pageable.unpaged());

        return ResponseEntity.ok(messagesPage.getContent());
    }

    @GetMapping("/conversation/{otherUserId}")
    public ResponseEntity<Page<ChatMessageResponse>> getMessagesBetweenUsers(
            @PathVariable String otherUserId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        log.info("Getting messages between user {} and contact {}", username, otherUserId);

        Pageable pageable = PageRequest.of(page, size, Sort.by("timestamp").descending());
        Page<ChatMessageResponse> messages = messageService.getMessagesBetweenUsers(username, otherUserId, pageable);

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
        String username = auth.getName();

        log.info("Marking messages as read for user {} in conversation {}", username, conversationId);
        
        // Check if the conversationId is already in the correct format (uuid_uuid)
        if (!conversationId.contains("_")) {
            log.info("Converting contact ID to conversation ID");
            
            try {
                // Find the current user
                User currentUser = userRepository.findByUsername(username)
                        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
                
                // Find the contact user
                User contactUser = userRepository.findById(UUID.fromString(conversationId))
                        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
                
                // Generate the conversation ID using both user IDs
                String generatedConversationId = currentUser.getId().compareTo(contactUser.getId()) < 0 
                        ? currentUser.getId() + "_" + contactUser.getId() 
                        : contactUser.getId() + "_" + currentUser.getId();
                
                log.info("Generated conversation ID: {} from contact ID: {}", generatedConversationId, conversationId);
                conversationId = generatedConversationId;
            } catch (Exception e) {
                log.error("Error converting contact ID to conversation ID", e);
                // Continue with the original ID as a fallback
            }
        }
        
        messageService.markMessagesAsRead(username, conversationId);

        return ResponseEntity.ok().build();
    }

    @PostMapping("/messages/read/{contactId}")
    public ResponseEntity<Void> markMessagesAsReadAlternative(@PathVariable String contactId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        log.info("Marking messages as read for user {} from contact {}", username, contactId);
        
        // Find the current user
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        
        // Find the contact user
        User contactUser = userRepository.findById(UUID.fromString(contactId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        
        // Generate the conversation ID using both user IDs
        String conversationId = currentUser.getId().compareTo(contactUser.getId()) < 0 
                ? currentUser.getId() + "_" + contactUser.getId() 
                : contactUser.getId() + "_" + currentUser.getId();
        
        log.info("Generated conversation ID: {} for marking messages as read", conversationId);
        
        // Call the service with the correct conversation ID
        messageService.markMessagesAsRead(username, conversationId);

        return ResponseEntity.ok().build();
    }

    @GetMapping("/latest")
    public ResponseEntity<List<ChatMessageResponse>> getLatestMessagesForUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        log.info("Getting latest messages for user {}", username);
        List<ChatMessageResponse> latestMessages = messageService.getLatestMessagesForUser(username);

        return ResponseEntity.ok(latestMessages);
    }

    @GetMapping("/unread/count")
    public ResponseEntity<Integer> getUnreadMessageCount() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        log.info("Getting unread message count for user {}", username);
        int unreadCount = messageService.getUnreadMessageCount(username);

        return ResponseEntity.ok(unreadCount);
    }

    @GetMapping("/messages/unread/count")
    public ResponseEntity<Map<String, Integer>> getUnreadMessageCountAlternative() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        log.info("Getting unread message count for user {}", username);
        int unreadCount = messageService.getUnreadMessageCount(username);

        Map<String, Integer> response = new HashMap<>();
        response.put("count", unreadCount);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/unread/count/{senderId}")
    public ResponseEntity<Integer> getUnreadMessageCountFromUser(@PathVariable String senderId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        log.info("Getting unread message count from user {} for user {}", senderId, username);
        int unreadCount = messageService.getUnreadMessageCountFromUser(username, senderId);

        return ResponseEntity.ok(unreadCount);
    }
}
