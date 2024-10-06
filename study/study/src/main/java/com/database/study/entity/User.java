package com.database.study.entity;

import java.time.LocalDate;

import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.GenerationType;
import java.util.UUID;
import java.util.Set;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class User {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  UUID id;
  String username;
  String password;
  String firstname;
  String lastname;
  LocalDate dob;
  @ElementCollection
  Set<String> roles; // every element is unique # List
}
