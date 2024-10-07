package com.database.study.entity;

import java.time.LocalDate;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
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
  // Define roles collection table and columns
  @ElementCollection
  @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
  @Column(name = "role") // This is the column name for the role value
  Set<String> roles; // Use Set for unique roles
}
