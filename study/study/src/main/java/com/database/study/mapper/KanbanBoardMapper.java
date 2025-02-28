// KanbanBoardMapper.java
package com.database.study.mapper;

import com.database.study.dto.request.KanbanBoardRequest;
import com.database.study.dto.response.KanbanBoardResponse;
import com.database.study.entity.KanbanBoard;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", 
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
        uses = {KanbanColumnMapper.class})
public interface KanbanBoardMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "columns", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    KanbanBoard toEntity(KanbanBoardRequest request);

    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "columns", source = "columns")
    KanbanBoardResponse toResponse(KanbanBoard board);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "columns", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    void updateEntity(@MappingTarget KanbanBoard board, KanbanBoardRequest request);
}