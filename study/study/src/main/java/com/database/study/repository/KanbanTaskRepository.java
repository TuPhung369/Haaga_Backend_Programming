// KanbanTaskRepository.java
package com.database.study.repository;

import com.database.study.entity.KanbanTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface KanbanTaskRepository extends JpaRepository<KanbanTask, UUID> {
    List<KanbanTask> findByColumnIdOrderByPositionAsc(UUID columnId);
    @Query("SELECT MAX(t.position) FROM KanbanTask t WHERE t.column.id = ?1")
    Integer findMaxPositionByColumnId(UUID columnId);
}