package com.database.study.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import java.util.Date;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InvalidatedToken {
  @Id
  String id;
  Date expiryTime;
  String name;
  String description;
}
