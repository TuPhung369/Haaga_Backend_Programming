package com.database.study.entity;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Converter
public class MapConverter implements AttributeConverter<Map<String, Object>, String> {
  private final ObjectMapper objectMapper = new ObjectMapper();

  @Override
  public String convertToDatabaseColumn(Map<String, Object> attribute) {
    try {
      if (attribute == null || attribute.isEmpty()) {
        return null;
      }
      return objectMapper.writeValueAsString(attribute);
    } catch (JsonProcessingException e) {
      throw new IllegalArgumentException("Error converting map to JSON: " + e.getMessage(), e);
    }
  }

  @Override
  public Map<String, Object> convertToEntityAttribute(String dbData) {
    // Always return an empty map for null or empty data
    if (dbData == null || dbData.isEmpty()) {
      return new HashMap<>();
    }

    try {
      // Try to parse as a Map first
      return objectMapper.readValue(dbData, new TypeReference<Map<String, Object>>() {
      });
    } catch (JsonProcessingException e) {
      try {
        // Check if it's an array
        if (dbData.startsWith("[")) {
          Map<String, Object> result = new HashMap<>();
          result.put("items", objectMapper.readValue(dbData, new TypeReference<List<?>>() {
          }));
          return result;
        }
        // Check if it's a string
        else if (dbData.startsWith("\"") && dbData.endsWith("\"")) {
          Map<String, Object> result = new HashMap<>();
          result.put("value", objectMapper.readValue(dbData, String.class));
          return result;
        }
        // Check if it's a boolean
        else if (dbData.equals("true") || dbData.equals("false")) {
          Map<String, Object> result = new HashMap<>();
          result.put("value", "true".equals(dbData));
          return result;
        }
        // Check if it's a number
        else if (dbData.matches("-?\\d+(\\.\\d+)?")) {
          Map<String, Object> result = new HashMap<>();
          if (dbData.contains(".")) {
            result.put("value", Double.valueOf(dbData));
          } else {
            // Check if the number is within Integer range
            long parsedLong = Long.parseLong(dbData);
            if (parsedLong >= Integer.MIN_VALUE && parsedLong <= Integer.MAX_VALUE) {
              result.put("value", (int) parsedLong);
            } else {
              result.put("value", parsedLong);
            }
          }
          return result;
        }
      } catch (Exception nestedEx) {
        System.err.println("Failed to parse with alternative method: " + nestedEx.getMessage());
      }

      // If all parsing attempts fail, log the error and return an empty map with
      // error info
      System.err.println("Could not parse database data: " + dbData);
      System.err.println("Original error: " + e.getMessage());

      // Create a map with error information instead of returning null
      Map<String, Object> errorMap = new HashMap<>();
      errorMap.put("error", "Failed to parse data");
      errorMap.put("raw_data", dbData);
      return errorMap;
    } catch (Exception e) {
      // For any unexpected exception, log it
      System.err.println("Unexpected error converting database data to map: " + e.getMessage());
      System.err.println("Stack trace: " + e.getClass().getName());

      // Create a map with error information
      Map<String, Object> errorMap = new HashMap<>();
      errorMap.put("error", "Unexpected conversion error");
      errorMap.put("message", e.getMessage());
      return errorMap;
    }
  }
}