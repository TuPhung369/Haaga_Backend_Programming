// KanbanMoveTaskRequest.java
package com.database.study.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class KanbanMoveTaskRequest {
    @NotBlank(message = "Task ID is required")
    String taskId;

    @NotBlank(message = "Target column ID is required")
    String targetColumnId;

    @NotNull(message = "New position is required")
    Integer newPosition;

    String recaptchaToken;
}