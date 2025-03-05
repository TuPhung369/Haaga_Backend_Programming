package com.database.study.service;

import com.database.study.dto.request.EventRequest;
import com.database.study.dto.response.EventResponse;
import com.database.study.entity.Event;
import com.database.study.entity.User;
import com.database.study.exception.AppException;
import com.database.study.exception.ErrorCode;
import com.database.study.mapper.EventMapper;
import com.database.study.repository.EventRepository;
import com.database.study.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class EventService {

  EventRepository eventRepository;
  UserRepository userRepository;
  EventMapper eventMapper;

  @Transactional(readOnly = true)
  public List<EventResponse> getEventsByUserId(UUID userId) {

    if (!userRepository.existsById(userId)) {
      throw new AppException(ErrorCode.USER_NOT_FOUND);
    }

    List<Event> events = eventRepository.findByUserId(userId);
    if (events.isEmpty()) {
      return List.of();
    }

    return events.stream()
        .map(eventMapper::toEventResponse)
        .collect(Collectors.toList());
  }

  @Transactional
  public EventResponse createEvent(EventRequest request) {
    User user = userRepository.findById(request.getUserId())
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

    Event event = eventMapper.toEvent(request);
    event.setUser(user);

    if (request.getRepeat() == null || request.getRepeat().equals("none")) {
      event = eventRepository.save(event);
      event.setSeriesId(event.getId());
    } else {
      event.setSeriesId(event.getSeriesId() != null ? event.getSeriesId() : UUID.randomUUID().toString());
      event = eventRepository.save(event);
    }

    return eventMapper.toEventResponse(event);
  }

  @Transactional
  public EventResponse updateEvent(String eventId, EventRequest request) {
    Event event = eventRepository.findById(eventId)
        .orElseThrow(() -> new AppException(ErrorCode.EVENT_NOT_FOUND));

    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

      // Get authenticated username directly
    String authenticatedUsername = authentication.getName();
    // Get event owner username
    String eventUsername = event.getUser() != null ? event.getUser().getUsername() : null;
    String eventUserId = event.getUser() != null ? event.getUser().getId().toString() : null;
    
    // Check for admin role
    boolean isAdmin = authentication.getAuthorities().stream()
        .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

    if (!isAdmin && (eventUsername == null || !authenticatedUsername.equals(eventUsername))) {
        // Additional JWT-specific checks for backward compatibility
        if (authentication.getPrincipal() instanceof Jwt) {
            Jwt jwt = (Jwt) authentication.getPrincipal();
            String sub = jwt.getClaimAsString("sub");
            String tokenUserId = jwt.getClaimAsString("userId");
            
            // Allow if JWT sub or userId match
            if ((sub != null && eventUsername != null && sub.equals(eventUsername)) ||
                (tokenUserId != null && eventUserId != null && tokenUserId.equals(eventUserId))) {
                // Access granted via JWT claims
            } else {
                // Log error and deny access
                log.error(
                    "User (sub: {}, userId: {}) does not have permission to update event {}. Event owner: username={}, id={}",
                    sub, tokenUserId, eventId, eventUsername, eventUserId);
                throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
            }
        } else {
            // Log error and deny access
            log.error(
                "User {} does not have permission to update event {}. Event owner: username={}, id={}",
                authenticatedUsername, eventId, eventUsername, eventUserId);
            throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
        }
    }

    if (event.getRepeat() != null && !event.getRepeat().equals("none") &&
        request.getRepeat() != null && request.getRepeat().equals("none")) {
    } else if (event.getRepeat() != null && !event.getRepeat().equals("none") &&
        !event.getRepeat().equals(request.getRepeat())) {
      if (request.getExceptions() == null || request.getExceptions().isEmpty()) {
        List<Event> relatedEvents = eventRepository.findBySeriesId(event.getSeriesId());
        eventRepository.deleteAll(relatedEvents.stream()
            .filter(e -> !e.getId().equals(eventId))
            .collect(Collectors.toList()));
      }
    }

    eventMapper.updateEvent(event, request);
    User user = userRepository.findById(request.getUserId())
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    event.setUser(user);

    event = eventRepository.save(event);
    return eventMapper.toEventResponse(event);
  }

  @Transactional
  public List<EventResponse> updateEventSeries(String seriesId, EventRequest request) {
    List<Event> events = eventRepository.findBySeriesId(seriesId);
    if (events.isEmpty()) {
      throw new AppException(ErrorCode.EVENT_NOT_FOUND);
    }

    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    // Additional logging for debugging
    log.info("Authentication principal: {}", authentication.getPrincipal());
    log.info("Authentication name: {}", authentication.getName());
    User user = userRepository.findById(request.getUserId())
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

            // Check for admin role first
    boolean isAdmin = authentication.getAuthorities().stream()
        .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    
    if (isAdmin) {
      return updateEventsForAdmin(events, request, user);
    }
        // Fallback to username-based authorization
    String authenticatedUsername = authentication.getName();
    String requestUsername = user.getUsername();

    if (!authenticatedUsername.equals(requestUsername)) {
        log.error(
            "User {} does not have permission to update event series {}. Requested username: {}",
            authenticatedUsername, seriesId, requestUsername);
        throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
    }
    
    return updateEvents(events, request, user);
}

  @Transactional
  @PreAuthorize("hasRole('ADMIN') || authentication.principal != null")
  public void deleteEvent(String eventId) {
    Event event = eventRepository.findById(eventId)
        .orElseThrow(() -> new AppException(ErrorCode.EVENT_NOT_FOUND));

    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication == null || !authentication.isAuthenticated()) {
      throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
    }

    // Check for admin role first
    boolean isAdmin = authentication.getAuthorities().stream()
        .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

    if (isAdmin) {
      eventRepository.delete(event);
      return;
    }

    // Handle different authentication scenarios
    String authenticatedUsername = authentication.getName();
    String eventUsername = event.getUser() != null ? event.getUser().getUsername() : null;
    String eventUserId = event.getUser() != null ? event.getUser().getId().toString() : null;

    // Additional check for JWT claims if the principal is a Jwt
    if (authentication.getPrincipal() instanceof Jwt) {
      Jwt jwt = (Jwt) authentication.getPrincipal();
      String sub = jwt.getClaimAsString("sub");
      String tokenUserId = jwt.getClaimAsString("userId");

      // Check if the authenticated user matches the event owner
      if ((sub != null && eventUsername != null && sub.equals(eventUsername)) ||
          (tokenUserId != null && eventUserId != null && tokenUserId.equals(eventUserId))) {
        eventRepository.delete(event);
        return;
      }
    }
    // Fallback to username-based check
    else if (authenticatedUsername.equals(eventUsername)) {
      eventRepository.delete(event);
      return;
    }

    // If no authorization is found, throw an unauthorized access exception
    log.error(
        "User (username: {}) does not have permission to delete event {}. Event owner: username={}, id={}",
        authenticatedUsername, eventId, eventUsername, eventUserId);
    throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
  }

  private List<EventResponse> updateEvents(List<Event> events, EventRequest request, User user) {
      List<Event> updatedEvents = events.stream().map(event -> {
          eventMapper.updateEvent(event, request);
          event.setUser(user);
          return eventRepository.save(event);
      }).collect(Collectors.toList());

      return updatedEvents.stream()
          .map(eventMapper::toEventResponse)
          .collect(Collectors.toList());
  }

  private List<EventResponse> updateEventsForAdmin(List<Event> events, EventRequest request, User user) {
      return updateEvents(events, request, user);
  }
}