package com.database.study.entity;

import java.util.Set;
import jakarta.persistence.Entity;
import jakarta.persistence.Column;
import jakarta.persistence.FetchType;
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
  @Column(unique = true)
  String name;
  String description;

  @ManyToMany(fetch = FetchType.EAGER)
  Set<Permission> permissions;

  public Role(String name) {
    this.name = name;
  }

}
