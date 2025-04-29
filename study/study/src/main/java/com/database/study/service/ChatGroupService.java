package com.database.study.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.database.study.dto.ChatGroupDTO;
import com.database.study.dto.UserDTO;
import com.database.study.dto.request.AddGroupMembersRequest;
import com.database.study.dto.request.CreateGroupRequest;
import com.database.study.dto.request.UpdateGroupRequest;
import com.database.study.entity.ChatGroup;
import com.database.study.entity.User;
import com.database.study.exception.ResourceNotFoundException;
import com.database.study.exception.UnauthorizedAccessException;
import com.database.study.repository.ChatGroupRepository;
import com.database.study.repository.ChatMessageRepository;
import com.database.study.repository.UserRepository;

@Service
public class ChatGroupService {

  @Autowired
  private ChatGroupRepository chatGroupRepository;

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private ChatMessageRepository chatMessageRepository;

  // Get all groups for a user
  public List<ChatGroupDTO> getGroupsForUser(UUID userId) {
    try {
      // System.out.println("ChatGroupService.getGroupsForUser: Starting for user " +
      // userId);

      // Find the user
      User user = userRepository.findById(userId)
          .orElseThrow(() -> new ResourceNotFoundException("User", userId.toString()));
      // System.out.println("ChatGroupService.getGroupsForUser: Found user " +
      // user.getEmail());

      // Find groups
      List<ChatGroup> groups = chatGroupRepository.findByMembersContaining(user);
      // System.out
      // .println("ChatGroupService.getGroupsForUser: Found " + (groups != null ?
      // groups.size() : 0) + " groups");

      if (groups == null || groups.isEmpty()) {
        // System.out.println("ChatGroupService.getGroupsForUser: No groups found,
        // returning empty list");
        return new ArrayList<>();
      }

      // Create a simple list to return
      List<ChatGroupDTO> result = new ArrayList<>();

      // Process each group individually to isolate errors
      for (ChatGroup group : groups) {
        try {
          System.out.println("ChatGroupService.getGroupsForUser: Processing group " + group.getId());

          // Get basic info without counting messages first
          ChatGroupDTO dto = new ChatGroupDTO();
          dto.setId(group.getId());
          dto.setName(group.getName() != null ? group.getName() : "Unnamed Group");

          if (group.getCreatedBy() != null) {
            dto.setCreatedBy(group.getCreatedBy().getId());
            String creatorName = "";
            if (group.getCreatedBy().getFirstname() != null) {
              creatorName += group.getCreatedBy().getFirstname();
            }
            if (group.getCreatedBy().getLastname() != null) {
              creatorName += " " + group.getCreatedBy().getLastname();
            }
            dto.setCreatedByName(creatorName.trim());
          }

          dto.setCreatedAt(group.getCreatedAt());
          dto.setLastMessage(group.getLastMessage());
          dto.setAvatar(group.getAvatar());

          // Try to count unread messages
          try {
            int unreadCount = (int) chatMessageRepository.countByGroupAndReceiverAndReadFalse(group, user);
            dto.setUnreadCount(unreadCount);
          } catch (Exception e) {
            System.err.println("ChatGroupService.getGroupsForUser: Error counting unread messages: " + e.getMessage());
            dto.setUnreadCount(0);
          }

          // Try to get members
          try {
            List<UserDTO> memberDTOs = new ArrayList<>();
            if (group.getMembers() != null) {
              for (User member : group.getMembers()) {
                if (member != null) {
                  UserDTO memberDTO = new UserDTO();
                  memberDTO.setId(member.getId());

                  String name = "";
                  if (member.getFirstname() != null) {
                    name += member.getFirstname();
                  }
                  if (member.getLastname() != null) {
                    name += " " + member.getLastname();
                  }
                  memberDTO.setName(name.trim());

                  memberDTO.setEmail(member.getEmail());
                  memberDTO.setStatus(member.getUserStatus());
                  memberDTOs.add(memberDTO);
                }
              }
            }
            dto.setMembers(memberDTOs);
          } catch (Exception e) {
            System.err.println("ChatGroupService.getGroupsForUser: Error processing members: " + e.getMessage());
            dto.setMembers(new ArrayList<>());
          }

          // Add to result
          result.add(dto);
          System.out.println("ChatGroupService.getGroupsForUser: Successfully processed group " + group.getId());
        } catch (Exception e) {
          System.err.println(
              "ChatGroupService.getGroupsForUser: Error processing group " + group.getId() + ": " + e.getMessage());
          // Use logger instead of printStackTrace
          System.err.println("Stack trace: " + e.getClass().getName());
          // Continue with next group
        }
      }

      System.out.println("ChatGroupService.getGroupsForUser: Returning " + result.size() + " groups");
      return result;
    } catch (Exception e) {
      // Log the error
      System.err.println(
          "ChatGroupService.getGroupsForUser: Error fetching groups for user " + userId + ": " + e.getMessage());
      // Use logger instead of printStackTrace
      System.err.println("Stack trace: " + e.getClass().getName());
      // Return an empty list as a fallback
      return new ArrayList<>();
    }
  }

  // Create a new group
  @Transactional
  public ChatGroupDTO createGroup(UUID creatorId, CreateGroupRequest request) {
    User creator = userRepository.findById(creatorId)
        .orElseThrow(() -> new ResourceNotFoundException("User", creatorId.toString()));

    // Ensure creator is included in members
    if (!request.getMemberIds().contains(creatorId)) {
      request.getMemberIds().add(creatorId);
    }

    // Get all users
    List<User> members = userRepository.findAllById(request.getMemberIds());

    // Check if all members exist
    if (members.size() != request.getMemberIds().size()) {
      throw new ResourceNotFoundException("Members", "One or more members not found");
    }

    ChatGroup group = ChatGroup.builder()
        .name(request.getName())
        .members(members)
        .createdBy(creator)
        .createdAt(LocalDateTime.now())
        .avatar(request.getAvatar())
        .build();

    ChatGroup savedGroup = chatGroupRepository.save(group);
    return ChatGroupDTO.fromEntity(savedGroup, 0);
  }

  // Get group details
  public ChatGroupDTO getGroupDetails(UUID groupId, UUID userId) {
    ChatGroup group = chatGroupRepository.findById(groupId)
        .orElseThrow(() -> new ResourceNotFoundException("Group", groupId.toString()));

    // Check if user is a member of the group
    if (!isMember(group, userId)) {
      throw new UnauthorizedAccessException("You are not a member of this group");
    }

    User user = userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("User", userId.toString()));

    int unreadCount = (int) chatMessageRepository.countByGroupAndReceiverAndReadFalse(group, user);
    return ChatGroupDTO.fromEntity(group, unreadCount);
  }

  // Update group details
  @Transactional
  public ChatGroupDTO updateGroup(UUID groupId, UUID userId, UpdateGroupRequest request) {
    ChatGroup group = chatGroupRepository.findById(groupId)
        .orElseThrow(() -> new ResourceNotFoundException("Group", groupId.toString()));

    // Check if user is the creator of the group
    if (!isCreator(group, userId)) {
      throw new UnauthorizedAccessException("Only the group creator can update group details");
    }

    // Update group details
    if (request.getName() != null && !request.getName().isEmpty()) {
      group.setName(request.getName());
    }

    if (request.getAvatar() != null) {
      group.setAvatar(request.getAvatar());
    }

    ChatGroup updatedGroup = chatGroupRepository.save(group);

    User user = userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("User", userId.toString()));

    int unreadCount = (int) chatMessageRepository.countByGroupAndReceiverAndReadFalse(updatedGroup, user);
    return ChatGroupDTO.fromEntity(updatedGroup, unreadCount);
  }

  // Add members to a group
  @Transactional
  public ChatGroupDTO addGroupMembers(UUID groupId, UUID userId, AddGroupMembersRequest request) {
    ChatGroup group = chatGroupRepository.findById(groupId)
        .orElseThrow(() -> new ResourceNotFoundException("Group", groupId.toString()));

    // Check if user is a member of the group
    if (!isMember(group, userId)) {
      throw new UnauthorizedAccessException("You are not a member of this group");
    }

    // Get existing member IDs
    List<UUID> existingMemberIds = group.getMembers().stream()
        .map(User::getId)
        .collect(Collectors.toList());

    // Filter out members that are already in the group
    List<UUID> membersToAdd = request.getMemberIds().stream()
        .filter(id -> !existingMemberIds.contains(id))
        .collect(Collectors.toList());

    if (!membersToAdd.isEmpty()) {
      // Get users to add
      List<User> newMembers = userRepository.findAllById(membersToAdd);

      // Check if all members exist
      if (newMembers.size() != membersToAdd.size()) {
        throw new ResourceNotFoundException("Members", "One or more members not found");
      }

      // Add new members
      group.getMembers().addAll(newMembers);
      ChatGroup updatedGroup = chatGroupRepository.save(group);

      User user = userRepository.findById(userId)
          .orElseThrow(() -> new ResourceNotFoundException("User", userId.toString()));

      int unreadCount = (int) chatMessageRepository.countByGroupAndReceiverAndReadFalse(updatedGroup, user);
      return ChatGroupDTO.fromEntity(updatedGroup, unreadCount);
    } else {
      // No new members to add
      User user = userRepository.findById(userId)
          .orElseThrow(() -> new ResourceNotFoundException("User", userId.toString()));

      int unreadCount = (int) chatMessageRepository.countByGroupAndReceiverAndReadFalse(group, user);
      return ChatGroupDTO.fromEntity(group, unreadCount);
    }
  }

  // Remove a member from a group
  @Transactional
  public ChatGroupDTO removeGroupMember(UUID groupId, UUID userId, UUID memberIdToRemove) {
    ChatGroup group = chatGroupRepository.findById(groupId)
        .orElseThrow(() -> new ResourceNotFoundException("Group", groupId.toString()));

    // Check if user is the creator of the group
    if (!isCreator(group, userId) && !userId.equals(memberIdToRemove)) {
      throw new UnauthorizedAccessException("Only the group creator can remove members");
    }

    // Check if member to remove is the creator
    if (isCreator(group, memberIdToRemove)) {
      throw new UnauthorizedAccessException("Cannot remove the group creator");
    }

    // Find the member to remove
    User memberToRemove = group.getMembers().stream()
        .filter(member -> member.getId().equals(memberIdToRemove))
        .findFirst()
        .orElseThrow(() -> new ResourceNotFoundException("Member", memberIdToRemove.toString()));

    // Remove the member
    group.getMembers().remove(memberToRemove);
    ChatGroup updatedGroup = chatGroupRepository.save(group);

    User user = userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("User", userId.toString()));

    int unreadCount = (int) chatMessageRepository.countByGroupAndReceiverAndReadFalse(updatedGroup, user);
    return ChatGroupDTO.fromEntity(updatedGroup, unreadCount);
  }

  // Leave a group
  @Transactional
  public void leaveGroup(UUID groupId, UUID userId) {
    ChatGroup group = chatGroupRepository.findById(groupId)
        .orElseThrow(() -> new ResourceNotFoundException("Group", groupId.toString()));

    // Check if user is a member of the group
    if (!isMember(group, userId)) {
      throw new UnauthorizedAccessException("You are not a member of this group");
    }

    // Check if user is the creator
    if (isCreator(group, userId)) {
      throw new UnauthorizedAccessException("Group creator cannot leave the group. Delete the group instead.");
    }

    // Find the user
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("User", userId.toString()));

    // Remove the user from the group
    group.getMembers().remove(user);
    chatGroupRepository.save(group);
  }

  // Delete a group
  @Transactional
  public void deleteGroup(UUID groupId, UUID userId) {
    ChatGroup group = chatGroupRepository.findById(groupId)
        .orElseThrow(() -> new ResourceNotFoundException("Group", groupId.toString()));

    // Check if user is the creator of the group
    if (!isCreator(group, userId)) {
      throw new UnauthorizedAccessException("Only the group creator can delete the group");
    }

    // Delete all messages in the group
    chatMessageRepository.deleteByGroupId(groupId);

    // Delete the group
    chatGroupRepository.delete(group);
  }

  // Helper method to check if a user is a member of a group
  private boolean isMember(ChatGroup group, UUID userId) {
    return group.getMembers().stream()
        .anyMatch(member -> member.getId().equals(userId));
  }

  // Helper method to check if a user is the creator of a group
  private boolean isCreator(ChatGroup group, UUID userId) {
    return group.getCreatedBy().getId().equals(userId);
  }
}