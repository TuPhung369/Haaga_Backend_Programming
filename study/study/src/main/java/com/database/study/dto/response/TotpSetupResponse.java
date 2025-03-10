package com.database.study.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TotpSetupResponse {
    UUID secretId;
    String secretKey;
    String qrCodeUri;
}