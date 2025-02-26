package com.database.study.controller;

import com.database.study.dto.request.EventCreationRequest;
import com.database.study.dto.response.ApiResponse;
import com.database.study.dto.response.EventResponse;
import com.database.study.service.EventService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/events")
public class EventController {

  EventService eventService;

  @GetMapping
  public ApiResponse<List<EventResponse>> getEventsByUserId(@RequestParam("userId") UUID userId) {
    List<EventResponse> events = eventService.getEventsByUserId(userId);
    return ApiResponse.<List<EventResponse>>builder()
        .result(events)
        .build();
  }

  @PostMapping
  public ApiResponse<EventResponse> createEvent(@RequestBody @Valid EventCreationRequest request) {
    EventResponse eventResponse = eventService.createEvent(request);
    return ApiResponse.<EventResponse>builder()
        .result(eventResponse)
        .build();
  }

  @PutMapping("/{eventId}")
  public ApiResponse<EventResponse> updateEvent(
      @PathVariable String eventId,
      @RequestBody @Valid EventCreationRequest request) {
    EventResponse eventResponse = eventService.updateEvent(eventId, request);
    return ApiResponse.<EventResponse>builder()
        .result(eventResponse)
        .build();
  }

  @DeleteMapping("/{eventId}")
  public ApiResponse<String> deleteEvent(@PathVariable String eventId) {
    eventService.deleteEvent(eventId);
    return ApiResponse.<String>builder()
        .code(2000)
        .message("Event successfully deleted")
        .result("Event ID: " + eventId)
        .build();
  }
}