package com.database.study.entity;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.ArrayList;
import java.util.List;

@Converter
public class ExceptionsConverter implements AttributeConverter<List<Event.ExceptionEntry>, String> {
  private final ObjectMapper objectMapper = new ObjectMapper();

  @Override
  public String convertToDatabaseColumn(List<Event.ExceptionEntry> attribute) {
    try {
      if (attribute == null || attribute.isEmpty()) {
        return null;
      }
      return objectMapper.writeValueAsString(attribute);
    } catch (JsonProcessingException e) {
      throw new IllegalArgumentException("Error converting exceptions to JSON: " + e.getMessage(), e);
    }
  }

  @Override
  public List<Event.ExceptionEntry> convertToEntityAttribute(String dbData) {
    try {
      if (dbData == null || dbData.isEmpty()) {
        return new ArrayList<>();
      }
      return objectMapper.readValue(dbData, new TypeReference<List<Event.ExceptionEntry>>() {});
    } catch (JsonMappingException e) {
      throw new IllegalArgumentException("Error mapping JSON to exception entries: " + e.getMessage(), e);
    } catch (JsonProcessingException e) {
      throw new IllegalArgumentException("Error processing JSON from database: " + e.getMessage(), e);
    }
  }
}