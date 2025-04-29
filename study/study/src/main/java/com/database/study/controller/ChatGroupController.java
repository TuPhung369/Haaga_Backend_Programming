package com.database.study.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

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
import com.database.study.dto.request.CreateGroupRequest;
import com.database.study.dto.request.UpdateGroupRequest;
import com.database.study.entity.User;
import com.database.study.exception.AppException;
import com.database.study.exception.ErrorCode;
import com.database.study.repository.UserRepository;
import com.database.study.service.ChatGroupService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/chat/groups")
public class ChatGroupController {

    @Autowired
    private ChatGroupService chatGroupService;

    @Autowired
    private UserRepository userRepository;

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
}