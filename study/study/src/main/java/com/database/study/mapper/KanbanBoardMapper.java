// KanbanBoardMapper.java
package com.database.study.mapper;

import com.database.study.dto.request.KanbanBoardRequest;
import com.database.study.dto.response.KanbanBoardResponse;
import com.database.study.dto.response.KanbanColumnResponse;
import com.database.study.entity.KanbanBoard;
import com.database.study.entity.KanbanColumn;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import java.util.List;

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
    @Mapping(target = "columns", expression = "java(toColumnResponseList(board.getColumns()))")
    KanbanBoardResponse toResponse(KanbanBoard board);
    
    // Helper methods for mapping lists
    List<KanbanColumnResponse> toColumnResponseList(List<KanbanColumn> columns);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "columns", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    void updateEntity(@MappingTarget KanbanBoard board, KanbanBoardRequest request);
}