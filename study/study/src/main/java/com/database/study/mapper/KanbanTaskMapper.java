// KanbanTaskMapper.java
package com.database.study.mapper;

import com.database.study.dto.request.KanbanTaskRequest;
import com.database.study.dto.response.KanbanTaskResponse;
import com.database.study.entity.KanbanTask;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import java.util.UUID;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE, 
        imports = {UUID.class})
public interface KanbanTaskMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "column", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    KanbanTask toEntity(KanbanTaskRequest request);

    @Mapping(target = "columnId", source = "column.id")
    KanbanTaskResponse toResponse(KanbanTask task);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "column", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    void updateEntity(@MappingTarget KanbanTask task, KanbanTaskRequest request);
}