package com.database.study.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TextToSpeechResponse {
    private boolean success;
    private String audio;
    private String format;
    private String language;
} 