package com.database.study.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

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

  @Column(unique = true)
  String email;
  String username;
  String password;
  String firstname;
  String lastname;
  LocalDate dob;
  @Column(nullable = false)
  @Builder.Default
  boolean active = false;

  @Column(nullable = false)
  @Builder.Default
  boolean block = false;

  @Column(nullable = false)
  @Builder.Default
  int timeTried = 0;
  
  // New fields
  @Column(nullable = true)
  String avatar;
  
  @Column(nullable = true)
  String position;
  
  @Column(nullable = true)
  String department;
  
  @Column(nullable = true)
  String education;
  
  @Column(nullable = true)
  @Builder.Default
  String userStatus = "online"; // online, away, busy, offline

  @ManyToMany(fetch = FetchType.EAGER)
  @JoinTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"), inverseJoinColumns = @JoinColumn(name = "role_id"))
  Set<Role> roles;

  @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
  private TotpSecurity totpSecurity;

  public TotpSecurity getTotpSecurity() {
    return totpSecurity;
  }

  public void setTotpSecurity(TotpSecurity totpSecurity) {
    this.totpSecurity = totpSecurity;
  }
}