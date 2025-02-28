// KanbanColumnMapper.java
package com.database.study.mapper;

import com.database.study.dto.request.KanbanColumnRequest;
import com.database.study.dto.response.KanbanColumnResponse;
import com.database.study.entity.KanbanColumn;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", 
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
        uses = {KanbanTaskMapper.class})
public interface KanbanColumnMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "board", ignore = true)
    @Mapping(target = "tasks", ignore = true)
    KanbanColumn toEntity(KanbanColumnRequest request);

    @Mapping(target = "boardId", source = "board.id")
    @Mapping(target = "tasks", source = "tasks")
    KanbanColumnResponse toResponse(KanbanColumn column);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "board", ignore = true)
    @Mapping(target = "tasks", ignore = true)
    void updateEntity(@MappingTarget KanbanColumn column, KanbanColumnRequest request);
}