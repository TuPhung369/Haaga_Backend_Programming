package com.database.study.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class EventCreationRequest {
  @NotBlank(message = "Title cannot be blank")
  String title;

  @NotNull(message = "Start time is required")
  LocalDateTime start;

  @NotNull(message = "End time is required")
  LocalDateTime end;

  @NotNull(message = "Date is required")
  LocalDateTime date;

  String description;

  String color;

  Boolean allDay;

  String repeat;

  @NotNull(message = "User ID is required")
  UUID userId;
}