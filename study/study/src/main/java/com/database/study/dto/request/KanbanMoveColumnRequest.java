// KanbanMoveColumnRequest.java
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
public class KanbanMoveColumnRequest {
    @NotNull(message = "Column ID is required")
    UUID columnId;
    
    @NotNull(message = "New position is required")
    Integer newPosition;
}
