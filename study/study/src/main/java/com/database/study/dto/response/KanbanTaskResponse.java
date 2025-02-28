// KanbanTaskResponse.java
package com.database.study.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class KanbanTaskResponse {
    UUID id;
    String title;
    String description;
    String priority;
    int position;
    UUID columnId;
    LocalDateTime createdAt;
}