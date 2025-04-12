package com.database.study.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContactRequest {
    
    @NotBlank(message = "Username or email is required")
    private String usernameOrEmail;
    
    private String displayName;
}
