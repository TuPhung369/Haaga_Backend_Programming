package com.database.study.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TotpDeviceResponse {
    UUID id;
    String deviceName;
    LocalDateTime createdAt;
    boolean active;
}