package com.database.study.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.database.study.dto.ChatGroupDTO;
import com.database.study.dto.request.ChatMessageRequest;
import com.database.study.dto.response.ChatMessageResponse;
import com.database.study.entity.User;
import com.database.study.exception.AppException;
import com.database.study.exception.ErrorCode;
import com.database.study.repository.UserRepository;
import com.database.study.service.ChatGroupService;
import com.database.study.service.ChatMessageService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/chat/group-messages")
public class GroupMessageController {

  @Autowired
  private ChatGroupService chatGroupService;

  @Autowired
  private ChatMessageService chatMessageService;

  @Autowired
  private UserRepository userRepository;

  // Debug endpoint
  @GetMapping("/debug")
  public ResponseEntity<String> debug() {
    return ResponseEntity.ok("GroupMessageController is working!");
  }

  // Get messages for a group
  @GetMapping("/{groupId}")
  public ResponseEntity<List<ChatMessageResponse>> getGroupMessages(
      @PathVariable UUID groupId,
      Authentication authentication) {
    try {
      String username = authentication.getName();
      User user = userRepository.findByUsername(username)
          .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
      UUID userId = user.getId();

      try {
        // Check if user is a member of the group
        ChatGroupDTO group = chatGroupService.getGroupDetails(groupId, userId);
        if (group == null) {
          throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
        }

        // Get messages for the group
        List<ChatMessageResponse> messages = chatMessageService.getGroupMessages(groupId, userId);
        return ResponseEntity.ok(messages);
      } catch (com.database.study.exception.ResourceNotFoundException e) {
        // Log the error and return a more specific error message
        System.err.println("Group not found when getting messages: " + e.getMessage());
        throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Group with ID " + groupId + " not found");
      }
    } catch (AppException e) {
      throw e;
    } catch (Exception e) {
      System.err.println("Error getting group messages: " + e.getMessage());
      throw new AppException(ErrorCode.GENERAL_EXCEPTION);
    }
  }

  // Send a message to a group
  @PostMapping("/{groupId}")
  public ResponseEntity<ChatMessageResponse> sendGroupMessage(
      @PathVariable UUID groupId,
      @Valid @RequestBody ChatMessageRequest request,
      Authentication authentication) {
    try {
      String username = authentication.getName();
      User user = userRepository.findByUsername(username)
          .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
      UUID userId = user.getId();

      try {
        // Check if user is a member of the group
        ChatGroupDTO group = chatGroupService.getGroupDetails(groupId, userId);
        if (group == null) {
          throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
        }

        // Set the group ID in the request
        request.setGroupId(groupId.toString());
        
        // Ensure receiverId is null for group messages
        if (request.getReceiverId() != null) {
            System.out.println("WARNING: Clearing receiverId from group message request: " + request.getReceiverId());
            request.setReceiverId(null);
        }

        // Send the message
        ChatMessageResponse response = chatMessageService.sendGroupMessage(username, request);
        return ResponseEntity.ok(response);
      } catch (com.database.study.exception.ResourceNotFoundException e) {
        // Log the error and return a more specific error message
        System.err.println("Group not found when sending message: " + e.getMessage());
        throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Group with ID " + groupId + " not found");
      }
    } catch (AppException e) {
      throw e;
    } catch (Exception e) {
      System.err.println("Error sending group message: " + e.getMessage());
      throw new AppException(ErrorCode.GENERAL_EXCEPTION);
    }
  }

  // Mark messages as read for a group
  @PostMapping("/{groupId}/read")
  public ResponseEntity<Void> markGroupMessagesAsRead(
      @PathVariable UUID groupId,
      Authentication authentication) {
    try {
      String username = authentication.getName();
      User user = userRepository.findByUsername(username)
          .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
      UUID userId = user.getId();

      try {
        // Check if user is a member of the group
        ChatGroupDTO group = chatGroupService.getGroupDetails(groupId, userId);
        if (group == null) {
          throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
        }

        // Mark messages as read
        chatMessageService.markGroupMessagesAsRead(username, groupId);
        return ResponseEntity.ok().build();
      } catch (com.database.study.exception.ResourceNotFoundException e) {
        // Log the error and return a more specific error message
        System.err.println("Group not found when marking messages as read: " + e.getMessage());
        throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Group with ID " + groupId + " not found");
      }
    } catch (AppException e) {
      throw e;
    } catch (Exception e) {
      System.err.println("Error marking group messages as read: " + e.getMessage());
      throw new AppException(ErrorCode.GENERAL_EXCEPTION);
    }
  }
}