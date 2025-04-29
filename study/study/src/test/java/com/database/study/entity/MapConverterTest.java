package com.database.study.entity;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.util.HashMap;
import java.util.Map;

public class MapConverterTest {

    private final MapConverter converter = new MapConverter();

    @Test
    public void testConvertToEntityAttribute_ValidMap() {
        String json = "{\"key\":\"value\",\"number\":123}";
        Map<String, Object> result = converter.convertToEntityAttribute(json);
        
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("value", result.get("key"));
        assertEquals(123, result.get("number"));
    }

    @Test
    public void testConvertToEntityAttribute_Array() {
        String json = "[1,2,3]";
        Map<String, Object> result = converter.convertToEntityAttribute(json);
        
        assertNotNull(result);
        assertEquals(1, result.size());
        assertTrue(result.containsKey("items"));
    }

    @Test
    public void testConvertToEntityAttribute_String() {
        String json = "\"test string\"";
        Map<String, Object> result = converter.convertToEntityAttribute(json);
        
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("test string", result.get("value"));
    }

    @Test
    public void testConvertToEntityAttribute_Boolean() {
        String json = "true";
        Map<String, Object> result = converter.convertToEntityAttribute(json);
        
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(true, result.get("value"));
    }

    @Test
    public void testConvertToEntityAttribute_Number() {
        String json = "123.45";
        Map<String, Object> result = converter.convertToEntityAttribute(json);
        
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(123.45, result.get("value"));
    }

    @Test
    public void testConvertToEntityAttribute_Null() {
        Map<String, Object> result = converter.convertToEntityAttribute(null);
        
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    public void testConvertToEntityAttribute_Empty() {
        Map<String, Object> result = converter.convertToEntityAttribute("");
        
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    public void testConvertToEntityAttribute_Invalid() {
        String json = "not valid json";
        Map<String, Object> result = converter.convertToEntityAttribute(json);
        
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    public void testConvertToDatabaseColumn_ValidMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("key", "value");
        map.put("number", 123);
        
        String result = converter.convertToDatabaseColumn(map);
        
        assertNotNull(result);
        assertTrue(result.contains("\"key\":\"value\""));
        assertTrue(result.contains("\"number\":123"));
    }

    @Test
    public void testConvertToDatabaseColumn_Empty() {
        String result = converter.convertToDatabaseColumn(new HashMap<>());
        
        assertNull(result);
    }

    @Test
    public void testConvertToDatabaseColumn_Null() {
        String result = converter.convertToDatabaseColumn(null);
        
        assertNull(result);
    }
}