package com.database.study.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EmailChangeRequest {
    private String userId;
    private String currentEmail;
    private String newEmail;
    private String password;
}