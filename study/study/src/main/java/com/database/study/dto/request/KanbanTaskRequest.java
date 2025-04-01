// KanbanTaskRequest.java
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
public class KanbanTaskRequest {
    @NotBlank(message = "Task title cannot be blank")
    String title;

    String description;

    @NotNull(message = "Priority is required")
    String priority;

    @NotBlank(message = "Column ID is required")
    String columnId;

    Integer position;

    String recaptchaToken;
}