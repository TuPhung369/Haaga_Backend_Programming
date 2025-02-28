// KanbanBoardRepository.java
package com.database.study.repository;

import com.database.study.entity.KanbanBoard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface KanbanBoardRepository extends JpaRepository<KanbanBoard, UUID> {
    List<KanbanBoard> findByUserId(UUID userId);
}