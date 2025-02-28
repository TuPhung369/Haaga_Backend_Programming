// KanbanColumnRequest.java
package com.database.study.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class KanbanColumnRequest {
    @NotBlank(message = "Column title cannot be blank")
    String title;
    
    @NotNull(message = "Board ID is required")
    UUID boardId;
    
    Integer position;
}