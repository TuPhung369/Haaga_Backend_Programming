// KanbanMoveTaskRequest.java
package com.database.study.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class KanbanMoveTaskRequest {
    @NotNull(message = "Task ID is required")
    UUID taskId;
    
    @NotNull(message = "Target column ID is required")
    UUID targetColumnId;
    
    @NotNull(message = "New position is required")
    Integer newPosition;
}