// KanbanColumnResponse.java
package com.database.study.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class KanbanColumnResponse {
    UUID id;
    String title;
    int position;
    UUID boardId;
    List<KanbanTaskResponse> tasks;
}
