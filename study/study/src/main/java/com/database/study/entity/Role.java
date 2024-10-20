package com.database.study.entity;

import java.util.Set;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Role {
  @Id
  String name;
  String description;

  @ManyToMany(mappedBy = "roles")
  Set<User> users;

  @ManyToMany
  Set<Permission> permissions;

  // Constructor to create Role from a String
  public Role(String name) {
    this.name = name;
  }
}