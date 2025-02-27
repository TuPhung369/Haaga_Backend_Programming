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
    String sub = authentication.getPrincipal() instanceof Jwt
        ? ((Jwt) authentication.getPrincipal()).getClaimAsString("sub")
        : null;
    String tokenUserId = authentication.getPrincipal() instanceof Jwt
        ? ((Jwt) authentication.getPrincipal()).getClaimAsString("userId")
        : null;
    String eventUsername = event.getUser() != null ? event.getUser().getUsername() : null;
    String eventUserId = event.getUser() != null ? event.getUser().getId().toString() : null;
    boolean isAdmin = authentication.getAuthorities().stream()
        .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

    if (!isAdmin && (sub == null || eventUsername == null || !sub.equals(eventUsername)) &&
        (tokenUserId == null || eventUserId == null || !tokenUserId.equals(eventUserId))) {
      log.error(
          "User (sub: {}, userId: {}) does not have permission to update event {}. Event owner: username={}, id={}",
          sub, tokenUserId, eventId, eventUsername, eventUserId);
      throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
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
    String sub = authentication.getPrincipal() instanceof Jwt
        ? ((Jwt) authentication.getPrincipal()).getClaimAsString("sub")
        : null;
    String tokenUserId = authentication.getPrincipal() instanceof Jwt
        ? ((Jwt) authentication.getPrincipal()).getClaimAsString("userId")
        : null;
    User user = userRepository.findById(request.getUserId())
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    String requestUsername = user.getUsername();
    String requestUserId = user.getId().toString();
    boolean isAdmin = authentication.getAuthorities().stream()
        .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

    if (!isAdmin && (sub == null || requestUsername == null || !sub.equals(requestUsername)) &&
        (tokenUserId == null || requestUserId == null || !tokenUserId.equals(requestUserId))) {
      log.error(
          "User (sub: {}, userId: {}) does not have permission to update event series {}. Requested: username={}, id={}",
          sub, tokenUserId, seriesId, requestUsername, requestUserId);
      throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
    }

    List<Event> updatedEvents = events.stream().map(event -> {
      eventMapper.updateEvent(event, request);
      event.setUser(user);
      return eventRepository.save(event);
    }).collect(Collectors.toList());

    return updatedEvents.stream()
        .map(eventMapper::toEventResponse)
        .collect(Collectors.toList());
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

    Jwt jwt = (Jwt) authentication.getPrincipal();
    String authenticatedUserId = jwt.getClaimAsString("sub");

    boolean isAdmin = authentication.getAuthorities().stream()
        .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

    if (!isAdmin) {
      User authenticatedUser = userRepository.findByUsername(authenticatedUserId)
          .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
      if (!authenticatedUser.getId().toString().equals(event.getUser().getId().toString())) {
        throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
      }
    }

    eventRepository.delete(event);
  }
}