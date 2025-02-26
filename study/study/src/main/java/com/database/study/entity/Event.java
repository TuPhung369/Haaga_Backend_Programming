package com.database.study.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Table(name = "events")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Event {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  String id;

  String seriesId;

  @Column(nullable = false)
  String title;

  @Column(nullable = false)
  LocalDateTime start;

  @Column(nullable = false)
  LocalDateTime end;

  @Column(nullable = false)
  LocalDateTime date;

  String description;

  String color;

  @Column(name = "all_day")
  Boolean allDay;

  @Column(name = "repeat_type")
  String repeat;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  User user;

  @Column(name = "created_at", updatable = false)
  LocalDateTime createdAt;

  @Column(name = "exceptions", columnDefinition = "json")
  @Convert(converter = ExceptionsConverter.class)
  @Builder.Default
  List<ExceptionEntry> exceptions = new ArrayList<>();

  @PrePersist
  protected void onCreate() {
    this.createdAt = LocalDateTime.now();
  }

  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  public static class ExceptionEntry {
    String originalStart;
  }
}