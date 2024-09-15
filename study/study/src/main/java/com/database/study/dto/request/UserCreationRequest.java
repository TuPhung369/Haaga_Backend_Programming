package com.database.study.dto.request;

import java.time.LocalDate;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class UserCreationRequest {

  @Size(min = 5, max = 20, message = "Username must be between 5 and 20 characters long")
  private String username;

  @Size(min = 8, message = "Password must be at least 8 characters long")
  @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()\\-_=+{};:,<.>])[A-Za-z\\d!@#$%^&*()\\-_=+{};:,<.>]{8,}$", message = "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character")
  private String password;

  @NotBlank(message = "Firstname cannot be blank")
  private String firstname;

  @NotBlank(message = "Lastname cannot be blank")
  private String lastname;

  @NotNull(message = "Date of birth is required")
  private LocalDate dob;

  // Getters and Setters
  public String getUsername() {
    return username;
  }

  public void setUsername(String username) {
    this.username = username;
  }

  public String getPassword() {
    return password;
  }

  public void setPassword(String password) {
    this.password = password;
  }

  public String getFirstname() {
    return firstname;
  }

  public void setFirstname(String firstname) {
    this.firstname = firstname;
  }

  public String getLastname() {
    return lastname;
  }

  public void setLastname(String lastname) {
    this.lastname = lastname;
  }

  public LocalDate getDob() {
    return dob;
  }

  public void setDob(LocalDate dob) {
    this.dob = dob;
  }

}
