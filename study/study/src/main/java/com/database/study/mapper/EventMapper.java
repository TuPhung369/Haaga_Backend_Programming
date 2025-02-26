package com.database.study.mapper;

import com.database.study.dto.request.EventRequest;
import com.database.study.dto.response.EventResponse;
import com.database.study.entity.Event;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface EventMapper {

  @Mapping(target = "id", ignore = true)
  @Mapping(target = "seriesId", expression = "java(request.getRepeat() != null && !request.getRepeat().equals(\"none\") ? java.util.UUID.randomUUID().toString() : null)")
  @Mapping(target = "user", ignore = true)
  @Mapping(target = "createdAt", ignore = true)
  @Mapping(target = "exceptions", source = "exceptions")
  Event toEvent(EventRequest request);

  @Mapping(target = "userId", source = "user.id")
  EventResponse toEventResponse(Event event);

  @Mapping(target = "id", ignore = true)
  @Mapping(target = "user", ignore = true)
  @Mapping(target = "createdAt", ignore = true)
  @Mapping(target = "seriesId", expression = "java(event.getSeriesId() != null ? event.getSeriesId() : (request.getRepeat() != null && !request.getRepeat().equals(\"none\") ? java.util.UUID.randomUUID().toString() : null))")
  @Mapping(target = "exceptions", source = "exceptions")
  void updateEvent(@MappingTarget Event event, EventRequest request);
}