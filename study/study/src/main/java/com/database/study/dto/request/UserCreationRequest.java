package com.database.study.dto.request;

import java.time.LocalDate;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserCreationRequest {

  @Size(min = 5, max = 20, message = "Username must be between 5 and 20 characters long")
  String username;

  @Size(min = 8, message = "Password must be at least 8 characters long")
  @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()\\-_=+{};:,<.>])[A-Za-z\\d!@#$%^&*()\\-_=+{};:,<.>]{8,}$", message = "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character")
  String password;

  @NotBlank(message = "Firstname cannot be blank")
  String firstname;

  @NotBlank(message = "Lastname cannot be blank")
  String lastname;

  @NotNull(message = "Date of birth is required")
  LocalDate dob;

}
