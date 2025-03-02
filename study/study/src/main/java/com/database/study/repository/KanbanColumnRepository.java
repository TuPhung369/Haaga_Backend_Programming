// KanbanColumnRepository.java
package com.database.study.repository;

import com.database.study.entity.KanbanColumn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface KanbanColumnRepository extends JpaRepository<KanbanColumn, UUID> {
    List<KanbanColumn> findByBoardIdOrderByPositionAsc(UUID boardId);
    void deleteByBoardId(UUID boardId);
    
    @Query("SELECT MAX(c.position) FROM KanbanColumn c WHERE c.board.id = ?1")
    Integer findMaxPositionByBoardId(UUID boardId);
    // Add this new method
    @Query("SELECT c FROM KanbanColumn c LEFT JOIN FETCH c.tasks t WHERE c.board.id = :boardId ORDER BY c.position ASC, t.position ASC")
    List<KanbanColumn> findByBoardIdWithTasksOrderByPositionAsc(@Param("boardId") UUID boardId);
}
