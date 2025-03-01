// KanbanService.java
package com.database.study.service;

import com.database.study.dto.request.*;
import com.database.study.dto.response.KanbanBoardResponse;
import com.database.study.entity.KanbanBoard;
import com.database.study.entity.KanbanColumn;
import com.database.study.entity.KanbanTask;
import com.database.study.entity.User;
import com.database.study.exception.AppException;
import com.database.study.exception.ErrorCode;
import com.database.study.mapper.KanbanBoardMapper;
import com.database.study.mapper.KanbanColumnMapper;
import com.database.study.mapper.KanbanTaskMapper;
import com.database.study.repository.KanbanBoardRepository;
import com.database.study.repository.KanbanColumnRepository;
import com.database.study.repository.KanbanTaskRepository;
import com.database.study.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class KanbanService {

    KanbanBoardRepository boardRepository;
    KanbanColumnRepository columnRepository;
    KanbanTaskRepository taskRepository;
    UserRepository userRepository;
    KanbanBoardMapper boardMapper;
    KanbanColumnMapper columnMapper;
    KanbanTaskMapper taskMapper;

    // Board operations
    @Transactional(readOnly = true)
    public List<KanbanBoardResponse> getBoardsByUserId(UUID userId) {
        if (!userRepository.existsById(userId)) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }

        List<KanbanBoard> boards = boardRepository.findByUserId(userId);
        return boards.stream()
                .map(boardMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public KanbanBoardResponse getBoardById(UUID boardId) {
        KanbanBoard board = boardRepository.findById(boardId)
                .orElseThrow(() -> new AppException(ErrorCode.KANBAN_BOARD_NOT_FOUND));
        
        checkUserAccess(board.getUser().getId());
        
        return boardMapper.toResponse(board);
    }

    @Transactional
    public KanbanBoardResponse createBoard(KanbanBoardRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        
        checkUserAccess(user.getId());
        
        KanbanBoard board = boardMapper.toEntity(request);
        board.setUser(user);
        
        // Create default columns
        List<KanbanColumn> defaultColumns = createDefaultColumns(board);
        board.setColumns(defaultColumns);
        
        board = boardRepository.save(board);
        return boardMapper.toResponse(board);
    }

    @Transactional
    public KanbanBoardResponse updateBoard(UUID boardId, KanbanBoardRequest request) {
        KanbanBoard board = boardRepository.findById(boardId)
                .orElseThrow(() -> new AppException(ErrorCode.KANBAN_BOARD_NOT_FOUND));
        
        checkUserAccess(board.getUser().getId());
        
        boardMapper.updateEntity(board, request);
        board = boardRepository.save(board);
        return boardMapper.toResponse(board);
    }

    @Transactional
    public void deleteBoard(UUID boardId) {
        KanbanBoard board = boardRepository.findById(boardId)
                .orElseThrow(() -> new AppException(ErrorCode.KANBAN_BOARD_NOT_FOUND));
        
        checkUserAccess(board.getUser().getId());
        
        boardRepository.delete(board);
    }

    // Column operations
    @Transactional
    public KanbanBoardResponse createColumn(KanbanColumnRequest request) {
        KanbanBoard board = boardRepository.findById(request.getBoardId())
                .orElseThrow(() -> new AppException(ErrorCode.KANBAN_BOARD_NOT_FOUND));
        
        checkUserAccess(board.getUser().getId());
        
        KanbanColumn column = columnMapper.toEntity(request);
        column.setBoard(board);
        
        // Set position if not provided
        if (request.getPosition() == null) {
            Integer maxPosition = columnRepository.findMaxPositionByBoardId(board.getId());
            column.setPosition(maxPosition != null ? maxPosition + 1 : 0);
        }
        
        column = columnRepository.save(column);
        board.getColumns().add(column);
        
        return boardMapper.toResponse(board);
    }

    @Transactional
    public KanbanBoardResponse updateColumn(UUID columnId, KanbanColumnRequest request) {
        KanbanColumn column = columnRepository.findById(columnId)
                .orElseThrow(() -> new AppException(ErrorCode.KANBAN_COLUMN_NOT_FOUND));
        
        checkUserAccess(column.getBoard().getUser().getId());
        
        columnMapper.updateEntity(column, request);
        column = columnRepository.save(column);
        
        return boardMapper.toResponse(column.getBoard());
    }

    @Transactional
    public KanbanBoardResponse deleteColumn(UUID columnId) {
        KanbanColumn column = columnRepository.findById(columnId)
                .orElseThrow(() -> new AppException(ErrorCode.KANBAN_COLUMN_NOT_FOUND));
        
        KanbanBoard board = column.getBoard();
        checkUserAccess(board.getUser().getId());
        
        columnRepository.delete(column);
        
        // Reorder remaining columns
        List<KanbanColumn> remainingColumns = columnRepository.findByBoardIdOrderByPositionAsc(board.getId());
        for (int i = 0; i < remainingColumns.size(); i++) {
            KanbanColumn col = remainingColumns.get(i);
            col.setPosition(i);
            columnRepository.save(col);
        }
        
        return boardMapper.toResponse(board);
    }

    @Transactional
    public KanbanBoardResponse moveColumn(KanbanMoveColumnRequest request) {
        KanbanColumn column = columnRepository.findById(request.getColumnId())
                .orElseThrow(() -> new AppException(ErrorCode.KANBAN_COLUMN_NOT_FOUND));
        
        KanbanBoard board = column.getBoard();
        checkUserAccess(board.getUser().getId());
        
        int oldPosition = column.getPosition();
        int newPosition = request.getNewPosition();
        
        List<KanbanColumn> columns = columnRepository.findByBoardIdOrderByPositionAsc(board.getId());
        
        // Reorder columns
        if (oldPosition < newPosition) {
            for (KanbanColumn col : columns) {
                if (col.getPosition() > oldPosition && col.getPosition() <= newPosition) {
                    col.setPosition(col.getPosition() - 1);
                    columnRepository.save(col);
                }
            }
        } else if (oldPosition > newPosition) {
            for (KanbanColumn col : columns) {
                if (col.getPosition() >= newPosition && col.getPosition() < oldPosition) {
                    col.setPosition(col.getPosition() + 1);
                    columnRepository.save(col);
                }
            }
        }
        
        column.setPosition(newPosition);
        columnRepository.save(column);
        
            // Normalize all column positions to ensure they are consecutive (0, 1, 2, 3...)
    List<KanbanColumn> allColumns = columnRepository.findByBoardIdOrderByPositionAsc(board.getId());
    for (int i = 0; i < allColumns.size(); i++) {
        KanbanColumn col = allColumns.get(i);
        if (col.getPosition() != i) {
            col.setPosition(i);
            columnRepository.save(col);
        }
    }
    
        KanbanBoard freshBoard = refreshBoardData(board.getId());
        return boardMapper.toResponse(freshBoard);
    }

    // Task operations
    @Transactional
    public KanbanBoardResponse createTask(KanbanTaskRequest request) {
        KanbanColumn column = columnRepository.findById(request.getColumnId())
                .orElseThrow(() -> new AppException(ErrorCode.KANBAN_COLUMN_NOT_FOUND));
        
        checkUserAccess(column.getBoard().getUser().getId());
        
        KanbanTask task = taskMapper.toEntity(request);
        task.setColumn(column);
        
        // Set position if not provided
        if (request.getPosition() == null) {
            Integer maxPosition = taskRepository.findMaxPositionByColumnId(column.getId());
            task.setPosition(maxPosition != null ? maxPosition + 1 : 0);
        }
        
        task = taskRepository.save(task);
        column.getTasks().add(task);
        
        return boardMapper.toResponse(column.getBoard());
    }

    @Transactional
    public KanbanBoardResponse updateTask(UUID taskId, KanbanTaskRequest request) {
        KanbanTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new AppException(ErrorCode.KANBAN_COLUMN_NOT_FOUND));
        
        checkUserAccess(task.getColumn().getBoard().getUser().getId());
        
        // Handle column change if necessary
        UUID originalColumnId = task.getColumn().getId();
        if (!originalColumnId.equals(request.getColumnId())) {
            KanbanColumn newColumn = columnRepository.findById(request.getColumnId())
                    .orElseThrow(() -> new AppException(ErrorCode.KANBAN_COLUMN_NOT_FOUND));
            
            // Check if new column belongs to the same board
            if (!newColumn.getBoard().getId().equals(task.getColumn().getBoard().getId())) {
                throw new AppException(ErrorCode.INVALID_OPERATION);
            }
            
            task.setColumn(newColumn);
            
            // Set position in new column if not specified
            if (request.getPosition() == null) {
                Integer maxPosition = taskRepository.findMaxPositionByColumnId(newColumn.getId());
                task.setPosition(maxPosition != null ? maxPosition + 1 : 0);
            }
        }
        
        taskMapper.updateEntity(task, request);
        task = taskRepository.save(task);
        
        return boardMapper.toResponse(task.getColumn().getBoard());
    }

    @Transactional
    public KanbanBoardResponse deleteTask(UUID taskId) {
        KanbanTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new AppException(ErrorCode.KANBAN_TASK_NOT_FOUND));
        
        KanbanColumn column = task.getColumn();
        checkUserAccess(column.getBoard().getUser().getId());
        
        taskRepository.delete(task);
        
        // Reorder remaining tasks
        List<KanbanTask> remainingTasks = taskRepository.findByColumnIdOrderByPositionAsc(column.getId());
        for (int i = 0; i < remainingTasks.size(); i++) {
            KanbanTask t = remainingTasks.get(i);
            t.setPosition(i);
            taskRepository.save(t);
        }
        
        return boardMapper.toResponse(column.getBoard());
    }

    @Transactional
    public KanbanBoardResponse moveTask(KanbanMoveTaskRequest request) {
        KanbanTask task = taskRepository.findById(request.getTaskId())
                .orElseThrow(() -> new AppException(ErrorCode.KANBAN_TASK_NOT_FOUND));
        
        KanbanColumn sourceColumn = task.getColumn();
        KanbanColumn targetColumn = columnRepository.findById(request.getTargetColumnId())
                .orElseThrow(() -> new AppException(ErrorCode.KANBAN_COLUMN_NOT_FOUND));
        
        // Make sure both columns belong to the same board
        if (!sourceColumn.getBoard().getId().equals(targetColumn.getBoard().getId())) {
            throw new AppException(ErrorCode.INVALID_OPERATION);
        }
        
        checkUserAccess(sourceColumn.getBoard().getUser().getId());
        
        // Moving within the same column
        if (sourceColumn.getId().equals(targetColumn.getId())) {
            int oldPosition = task.getPosition();
            int newPosition = request.getNewPosition();
            
            List<KanbanTask> tasks = taskRepository.findByColumnIdOrderByPositionAsc(sourceColumn.getId());
            
            // Reorder tasks
            if (oldPosition < newPosition) {
                for (KanbanTask t : tasks) {
                    if (t.getPosition() > oldPosition && t.getPosition() <= newPosition) {
                        t.setPosition(t.getPosition() - 1);
                        taskRepository.save(t);
                    }
                }
            } else if (oldPosition > newPosition) {
                for (KanbanTask t : tasks) {
                    if (t.getPosition() >= newPosition && t.getPosition() < oldPosition) {
                        t.setPosition(t.getPosition() + 1);
                        taskRepository.save(t);
                    }
                }
            }
            
            task.setPosition(newPosition);
            taskRepository.save(task);
        } 
        // Moving to another column
        else {
            int newPosition = request.getNewPosition();
            
            // Shift tasks in target column
            List<KanbanTask> targetTasks = taskRepository.findByColumnIdOrderByPositionAsc(targetColumn.getId());
            for (KanbanTask t : targetTasks) {
                if (t.getPosition() >= newPosition) {
                    t.setPosition(t.getPosition() + 1);
                    taskRepository.save(t);
                }
            }
            
            // Shift tasks in source column
            List<KanbanTask> sourceTasks = taskRepository.findByColumnIdOrderByPositionAsc(sourceColumn.getId());
            for (KanbanTask t : sourceTasks) {
                if (t.getPosition() > task.getPosition()) {
                    t.setPosition(t.getPosition() - 1);
                    taskRepository.save(t);
                }
            }
            
            // Move task to new column and position
            task.setColumn(targetColumn);
            task.setPosition(newPosition);
            taskRepository.save(task);
        }
                
        // Fetch all tasks for this board and assign them to the correct columns
        // for (KanbanColumn col : freshBoard.getColumns()) {
        //     List<KanbanTask> columnTasks = taskRepository.findByColumnIdOrderByPositionAsc(col.getId());
        //     col.getTasks().addAll(columnTasks);
        // }
        // Make sure tasks are properly loaded
        KanbanBoard freshBoard = refreshBoardData(sourceColumn.getBoard().getId());
        return boardMapper.toResponse(freshBoard);
    }

    // Helper methods
    private List<KanbanColumn> createDefaultColumns(KanbanBoard board) {
        List<KanbanColumn> columns = new ArrayList<>();
        String[] defaultTitles = {"Backlog","Pending", "To Do", "In Progress", "Done"};
        
        for (int i = 0; i < defaultTitles.length; i++) {
            KanbanColumn column = KanbanColumn.builder()
                    .title(defaultTitles[i])
                    .position(i)
                    .board(board)
                    .build();
            columns.add(column);
        }
        
        return columns;
    }

    private void checkUserAccess(UUID resourceOwnerId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
        }

        // Skip check for admins
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (isAdmin) {
            return;
        }

        // For JWT authentication
        if (authentication.getPrincipal() instanceof Jwt) {
            Jwt jwt = (Jwt) authentication.getPrincipal();
            
            // Check if userId claim exists and matches resource owner
            String tokenUserId = jwt.getClaimAsString("userId");
            if (tokenUserId != null && tokenUserId.equals(resourceOwnerId.toString())) {
                return;
            }
            
            // Check if username/sub matches resource owner's username
            String sub = jwt.getClaimAsString("sub");
            if (sub != null) {
                User resourceOwner = userRepository.findById(resourceOwnerId)
                        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
                if (resourceOwner.getUsername().equals(sub)) {
                    return;
                }
            }
        }
        
        log.error("User does not have permission to access resource owned by user ID: {}", resourceOwnerId);
        throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
    }

    private KanbanBoard refreshBoardData(UUID boardId) {
    // Get fresh board data
    KanbanBoard freshBoard = boardRepository.findById(boardId)
            .orElseThrow(() -> new AppException(ErrorCode.KANBAN_BOARD_NOT_FOUND));
    
    // Load columns with their tasks
    List<KanbanColumn> columnsWithTasks = columnRepository.findByBoardIdWithTasksOrderByPositionAsc(boardId);
    
    // Replace the columns in the board
    freshBoard.getColumns().clear();
    freshBoard.getColumns().addAll(columnsWithTasks);
    
    return freshBoard;
}
}