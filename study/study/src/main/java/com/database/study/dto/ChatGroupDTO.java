package com.database.study.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import com.database.study.entity.ChatGroup;
import com.database.study.entity.User;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatGroupDTO {
  private UUID id;
  private String name;
  private List<UserDTO> members;
  private UUID createdBy;
  private String createdByName;
  private LocalDateTime createdAt;
  private int unreadCount;
  private String lastMessage;
  private String avatar;

  public static ChatGroupDTO fromEntity(ChatGroup group, int unreadCount) {
    try {
      List<UserDTO> memberDTOs = group.getMembers().stream()
          .map(user -> convertToUserDTO(user))
          .collect(Collectors.toList());

      String createdByName = "";
      if (group.getCreatedBy() != null) {
        String firstName = group.getCreatedBy().getFirstname() != null ? group.getCreatedBy().getFirstname() : "";
        String lastName = group.getCreatedBy().getLastname() != null ? group.getCreatedBy().getLastname() : "";
        createdByName = firstName + " " + lastName;
      }

      return ChatGroupDTO.builder()
          .id(group.getId())
          .name(group.getName() != null ? group.getName() : "")
          .members(memberDTOs)
          .createdBy(group.getCreatedBy() != null ? group.getCreatedBy().getId() : null)
          .createdByName(createdByName.trim())
          .createdAt(group.getCreatedAt())
          .unreadCount(unreadCount)
          .lastMessage(group.getLastMessage())
          .avatar(group.getAvatar())
          .build();
    } catch (Exception e) {
      System.err.println("Error converting ChatGroup to ChatGroupDTO: " + e.getMessage());
      // Use logger instead of printStackTrace
      System.err.println("Stack trace: " + e.getClass().getName());

      // Return a minimal DTO with just the ID to avoid complete failure
      return ChatGroupDTO.builder()
          .id(group.getId())
          .name("Error loading group")
          .members(new ArrayList<>())
          .build();
    }
  }

  private static UserDTO convertToUserDTO(User user) {
    return UserDTO.builder()
        .id(user.getId())
        .name(user.getFirstname() + " " + user.getLastname())
        .email(user.getEmail())
        .status(user.getUserStatus())
        .build();
  }
}