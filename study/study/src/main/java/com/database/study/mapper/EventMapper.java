package com.database.study.mapper;

import java.util.List;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import com.database.study.dto.request.EventRequest;
import com.database.study.dto.response.EventResponse;
import com.database.study.entity.Event;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface EventMapper {

  @Mapping(target = "id", ignore = true)
  @Mapping(target = "seriesId", expression = "java(request.getRepeat() != null && !request.getRepeat().equals(\"none\") ? java.util.UUID.randomUUID().toString() : null)")
  @Mapping(target = "user", ignore = true)
  @Mapping(target = "createdAt", ignore = true)
  @Mapping(target = "exceptions", expression = "java(toEventExceptionEntries(request.getExceptions()))")
  Event toEvent(EventRequest request);

  @Mapping(target = "userId", source = "user.id")
  @Mapping(target = "exceptions", expression = "java(toResponseExceptionEntries(event.getExceptions()))")
  EventResponse toEventResponse(Event event);

  @Mapping(target = "id", ignore = true)
  @Mapping(target = "user", ignore = true)
  @Mapping(target = "createdAt", ignore = true)
  @Mapping(target = "seriesId", expression = "java(event.getSeriesId() != null ? event.getSeriesId() : (request.getRepeat() != null && !request.getRepeat().equals(\"none\") ? java.util.UUID.randomUUID().toString() : null))")
  @Mapping(target = "exceptions", expression = "java(toEventExceptionEntries(request.getExceptions()))")
  void updateEvent(@MappingTarget Event event, EventRequest request);
  
  // Map between ExceptionEntry types
  Event.ExceptionEntry toEventExceptionEntry(EventRequest.ExceptionEntry exceptionEntry);
  
  EventResponse.ExceptionEntry toResponseExceptionEntry(Event.ExceptionEntry exceptionEntry);
  
  // Map between lists of ExceptionEntry
  List<Event.ExceptionEntry> toEventExceptionEntries(List<EventRequest.ExceptionEntry> exceptionEntries);
  
  List<EventResponse.ExceptionEntry> toResponseExceptionEntries(List<Event.ExceptionEntry> exceptionEntries);
}