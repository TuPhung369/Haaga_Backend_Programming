// KanbanColumnMapper.java
package com.database.study.mapper;

import com.database.study.dto.request.KanbanColumnRequest;
import com.database.study.dto.response.KanbanColumnResponse;
import com.database.study.entity.KanbanColumn;
import com.database.study.entity.KanbanTask;
import com.database.study.dto.response.KanbanTaskResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import java.util.List;

@Mapper(componentModel = "spring", 
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
        uses = {KanbanTaskMapper.class})
public interface KanbanColumnMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "board", ignore = true)
    @Mapping(target = "tasks", ignore = true)
    KanbanColumn toEntity(KanbanColumnRequest request);

    @Mapping(target = "boardId", source = "board.id")
    @Mapping(target = "tasks", expression = "java(toTaskResponseList(column.getTasks()))")
    KanbanColumnResponse toResponse(KanbanColumn column);
    
    // Helper methods for mapping lists
    List<KanbanTaskResponse> toTaskResponseList(List<KanbanTask> tasks);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "board", ignore = true)
    @Mapping(target = "tasks", ignore = true)
    void updateEntity(@MappingTarget KanbanColumn column, KanbanColumnRequest request);
}