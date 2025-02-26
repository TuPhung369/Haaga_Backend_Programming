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
public class EventResponse {
    String id;
    String seriesId;
    String title;
    LocalDateTime start;
    LocalDateTime end;
    LocalDateTime date;
    String description;
    String color;
    Boolean allDay;
    String repeat;
    UUID userId;
    LocalDateTime createdAt;
    List<ExceptionEntry> exceptions;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExceptionEntry {
        String originalStart;
    }
}