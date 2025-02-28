// Request DTOs

// KanbanBoardRequest.java
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
public class KanbanBoardRequest {
    @NotBlank(message = "Board title cannot be blank")
    String title;
    
    @NotNull(message = "User ID is required")
    UUID userId;
}
