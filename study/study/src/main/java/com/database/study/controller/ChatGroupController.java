package com.database.study.controller;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import javax.sql.DataSource;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.database.study.dto.ChatGroupDTO;
import com.database.study.dto.request.AddGroupMembersRequest;
import com.database.study.dto.request.ChatMessageRequest;
import com.database.study.dto.request.CreateGroupRequest;
import com.database.study.dto.request.UpdateGroupRequest;
import com.database.study.dto.response.ChatMessageResponse;
import com.database.study.entity.User;
import com.database.study.exception.AppException;
import com.database.study.exception.ErrorCode;
import com.database.study.repository.UserRepository;
import com.database.study.service.ChatGroupService;
import com.database.study.service.ChatMessageService;
import com.zaxxer.hikari.HikariDataSource;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/chat/groups")
public class ChatGroupController {

    @Autowired
    private ChatGroupService chatGroupService;

    @Autowired
    private ChatMessageService chatMessageService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DataSource dataSource;

    // Get all groups for the current user
    @GetMapping
    public ResponseEntity<List<ChatGroupDTO>> getAllGroups(Authentication authentication) {
        try {
            System.out.println("ChatGroupController.getAllGroups: Starting to fetch groups");

            // Get username from authentication
            String username = authentication.getName();

            // Find user by username to get the UUID
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

            UUID userId = user.getId();
            System.out.println("ChatGroupController.getAllGroups: User ID: " + userId);

            List<ChatGroupDTO> groups = chatGroupService.getGroupsForUser(userId);
            System.out.println("ChatGroupController.getAllGroups: Successfully fetched "
                    + (groups != null ? groups.size() : 0) + " groups");
            return ResponseEntity.ok(groups != null ? groups : new ArrayList<>());
        } catch (Exception e) {
            System.err.println("ChatGroupController.getAllGroups: Error fetching groups: " + e.getMessage());
            // Use logger instead of printStackTrace
            System.err.println("Stack trace: " + e.getClass().getName());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ArrayList<>());
        }
    }

    // Create a new group
    @PostMapping
    public ResponseEntity<ChatGroupDTO> createGroup(
            @Valid @RequestBody CreateGroupRequest request,
            Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        UUID userId = user.getId();
        ChatGroupDTO group = chatGroupService.createGroup(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(group);
    }

    // Get group details
    @GetMapping("/{groupId}")
    public ResponseEntity<ChatGroupDTO> getGroupDetails(
            @PathVariable UUID groupId,
            Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        UUID userId = user.getId();
        ChatGroupDTO group = chatGroupService.getGroupDetails(groupId, userId);
        return ResponseEntity.ok(group);
    }

    // Update group details
    @PutMapping("/{groupId}")
    public ResponseEntity<ChatGroupDTO> updateGroup(
            @PathVariable UUID groupId,
            @RequestBody UpdateGroupRequest request,
            Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        UUID userId = user.getId();
        ChatGroupDTO group = chatGroupService.updateGroup(groupId, userId, request);
        return ResponseEntity.ok(group);
    }

    // Add members to a group
    @PostMapping("/{groupId}/members")
    public ResponseEntity<ChatGroupDTO> addGroupMembers(
            @PathVariable UUID groupId,
            @Valid @RequestBody AddGroupMembersRequest request,
            Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        UUID userId = user.getId();
        ChatGroupDTO group = chatGroupService.addGroupMembers(groupId, userId, request);
        return ResponseEntity.ok(group);
    }

    // Remove a member from a group
    @DeleteMapping("/{groupId}/members/{memberId}")
    public ResponseEntity<ChatGroupDTO> removeGroupMember(
            @PathVariable UUID groupId,
            @PathVariable UUID memberId,
            Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        UUID userId = user.getId();
        ChatGroupDTO group = chatGroupService.removeGroupMember(groupId, userId, memberId);
        return ResponseEntity.ok(group);
    }

    // Leave a group
    @PostMapping("/{groupId}/leave")
    public ResponseEntity<Void> leaveGroup(
            @PathVariable UUID groupId,
            Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        UUID userId = user.getId();
        chatGroupService.leaveGroup(groupId, userId);
        return ResponseEntity.ok().build();
    }

    // Delete a group (admin only)
    @DeleteMapping("/{groupId}")
    public ResponseEntity<Void> deleteGroup(
            @PathVariable UUID groupId,
            Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        UUID userId = user.getId();
        chatGroupService.deleteGroup(groupId, userId);
        return ResponseEntity.ok().build();
    }

    // Get messages for a group
    @GetMapping("/{groupId}/messages")
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
    @PostMapping("/{groupId}/messages")
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

                // Create a new request with only the necessary fields for a group message
                ChatMessageRequest groupRequest = new ChatMessageRequest();
                groupRequest.setContent(request.getContent());
                groupRequest.setGroupId(groupId.toString());
                groupRequest.setPersistent(request.getPersistent());
                // Explicitly not setting receiverId

                // Debug log
                System.out.println("Sending group message:");
                System.out.println("Group ID: " + groupId);
                System.out.println("Content: " + groupRequest.getContent());
                System.out.println("Receiver ID (should be null): " + groupRequest.getReceiverId());
                System.out.println("Persistent: " + groupRequest.getPersistent());

                // Send the message
                ChatMessageResponse response = chatMessageService.sendGroupMessage(username, groupRequest);
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
            System.err.println("Stack trace: " + e.getClass().getName()); // Log class name instead of stack trace

            // Check for specific database errors
            if (e.getMessage() != null && e.getMessage().contains("receiver_id")) {
                throw new AppException(ErrorCode.INVALID_REQUEST,
                        "Database error: receiver_id cannot be null. Please check your database schema.");
            } else if (e.getMessage() != null && e.getMessage().contains("constraint")) {
                throw new AppException(ErrorCode.INVALID_REQUEST, "Database constraint violation: " + e.getMessage());
            } else {
                throw new AppException(ErrorCode.GENERAL_EXCEPTION, "Error sending group message: " + e.getMessage());
            }
        }
    }

    // Debug endpoint to check if the controller is registered
    @GetMapping("/debug")
    public ResponseEntity<String> debug() {
        return ResponseEntity.ok("ChatGroupController is working!");
    }

    // Debug endpoint to check database schema for chat_message table
    @GetMapping("/debug/schema")
    public ResponseEntity<Map<String, Object>> debugSchema() {
        Map<String, Object> result = new HashMap<>();
        try (Connection connection = ((HikariDataSource) dataSource).getConnection()) {
            // Get database metadata
            DatabaseMetaData metaData = connection.getMetaData();

            // Get column info for chat_message table
            try (ResultSet columns = metaData.getColumns(null, null, "chat_message", null)) {
                List<Map<String, Object>> columnList = new ArrayList<>();

                while (columns.next()) {
                    Map<String, Object> column = new HashMap<>();
                    column.put("name", columns.getString("COLUMN_NAME"));
                    column.put("type", columns.getString("TYPE_NAME"));
                    column.put("nullable", columns.getInt("NULLABLE") == DatabaseMetaData.columnNullable);
                    columnList.add(column);
                }

                result.put("columns", columnList);
                result.put("status", "success");
            }

            return ResponseEntity.ok(result);
        } catch (java.sql.SQLException e) {
            result.put("status", "error");
            result.put("message", "Database error: " + e.getMessage());
            result.put("error_code", e.getErrorCode());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
        } catch (Exception e) {
            result.put("status", "error");
            result.put("message", "Unexpected error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
        }
    }

    // Debug endpoint for the read messages functionality
    @GetMapping("/{groupId}/messages/read/debug")
    public ResponseEntity<String> debugReadMessages(@PathVariable UUID groupId) {
        return ResponseEntity.ok("Read messages endpoint for group " + groupId + " is registered!");
    }

    // Debug endpoint to check all messages in a group
    @GetMapping("/{groupId}/messages/debug")
    public ResponseEntity<Map<String, Object>> debugGroupMessages(@PathVariable UUID groupId) {
        Map<String, Object> result = new HashMap<>();
        try (Connection connection = ((HikariDataSource) dataSource).getConnection();
                PreparedStatement stmt = connection.prepareStatement(
                        "SELECT * FROM chat_message WHERE group_id = ?")) {

            // Set parameters and execute query
            stmt.setString(1, groupId.toString());

            try (ResultSet rs = stmt.executeQuery()) {
                List<Map<String, Object>> messages = new ArrayList<>();
                while (rs.next()) {
                    Map<String, Object> message = new HashMap<>();
                    message.put("id", rs.getString("id"));
                    message.put("content", rs.getString("content"));
                    message.put("sender_id", rs.getString("sender_id"));
                    message.put("receiver_id", rs.getString("receiver_id"));
                    message.put("group_id", rs.getString("group_id"));
                    message.put("message_type", rs.getString("message_type"));
                    message.put("timestamp", rs.getTimestamp("timestamp"));
                    message.put("read", rs.getBoolean("read"));
                    message.put("conversation_id", rs.getString("conversation_id"));
                    messages.add(message);
                }

                result.put("messages", messages);
                result.put("count", messages.size());
                result.put("status", "success");
            }

            return ResponseEntity.ok(result);
        } catch (java.sql.SQLException e) {
            result.put("status", "error");
            result.put("message", "Database error: " + e.getMessage());
            result.put("error_code", e.getErrorCode());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
        } catch (Exception e) {
            result.put("status", "error");
            result.put("message", "Unexpected error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
        }
    }

    // Mark messages as read for a group (original endpoint)
    @PostMapping("/{groupId}/messages/read")
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

    // Mark messages as read for a group (alternative endpoint)
    @PostMapping("/{groupId}/mark-messages-read")
    public ResponseEntity<Void> markGroupMessagesAsReadAlt(
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