// KanbanBoardResponse.java
package com.database.study.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class KanbanBoardResponse {
    UUID id;
    String title;
    UUID userId;
    List<KanbanColumnResponse> columns;
    LocalDateTime createdAt;
}