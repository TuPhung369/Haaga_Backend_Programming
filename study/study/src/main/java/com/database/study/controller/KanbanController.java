package com.database.study.controller;

import com.database.study.dto.request.*;
import com.database.study.dto.response.ApiResponse;
import com.database.study.dto.response.KanbanBoardResponse;
import com.database.study.service.KanbanService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/kanban")
public class KanbanController {

    KanbanService kanbanService;

    // Board endpoints
    @GetMapping("/boards")
    public ApiResponse<List<KanbanBoardResponse>> getBoardsByUserId(@RequestParam("userId") UUID userId) {
        List<KanbanBoardResponse> boards = kanbanService.getBoardsByUserId(userId);
        return ApiResponse.<List<KanbanBoardResponse>>builder()
                .result(boards)
                .build();
    }

    @GetMapping("/boards/{boardId}")
    public ApiResponse<KanbanBoardResponse> getBoardById(@PathVariable UUID boardId) {
        KanbanBoardResponse board = kanbanService.getBoardById(boardId);
        return ApiResponse.<KanbanBoardResponse>builder()
                .result(board)
                .build();
    }

    @PostMapping("/boards")
    public ApiResponse<KanbanBoardResponse> createBoard(@RequestBody @Valid KanbanBoardRequest request) {
        KanbanBoardResponse board = kanbanService.createBoard(request);
        return ApiResponse.<KanbanBoardResponse>builder()
                .result(board)
                .build();
    }

    @PutMapping("/boards/{boardId}")
    public ApiResponse<KanbanBoardResponse> updateBoard(
            @PathVariable UUID boardId,
            @RequestBody @Valid KanbanBoardRequest request) {
        KanbanBoardResponse board = kanbanService.updateBoard(boardId, request);
        return ApiResponse.<KanbanBoardResponse>builder()
                .result(board)
                .build();
    }

    @DeleteMapping("/boards/{boardId}")
    public ApiResponse<String> deleteBoard(@PathVariable UUID boardId) {
        kanbanService.deleteBoard(boardId);
        return ApiResponse.<String>builder()
                .code(2000)
                .message("Board successfully deleted")
                .result("Board ID: " + boardId)
                .build();
    }

    // Column endpoints
    @PostMapping("/columns")
    public ApiResponse<KanbanBoardResponse> createColumn(@RequestBody @Valid KanbanColumnRequest request) {
        KanbanBoardResponse board = kanbanService.createColumn(request);
        return ApiResponse.<KanbanBoardResponse>builder()
                .result(board)
                .build();
    }

    @PutMapping("/columns/{columnId}")
    public ApiResponse<KanbanBoardResponse> updateColumn(
            @PathVariable UUID columnId,
            @RequestBody @Valid KanbanColumnRequest request) {
        KanbanBoardResponse board = kanbanService.updateColumn(columnId, request);
        return ApiResponse.<KanbanBoardResponse>builder()
                .result(board)
                .build();
    }

    @DeleteMapping("/columns/{columnId}")
    public ApiResponse<KanbanBoardResponse> deleteColumn(@PathVariable UUID columnId) {
        KanbanBoardResponse board = kanbanService.deleteColumn(columnId);
        return ApiResponse.<KanbanBoardResponse>builder()
                .result(board)
                .build();
    }

    @PostMapping("/columns/move")
    public ApiResponse<KanbanBoardResponse> moveColumn(@RequestBody @Valid KanbanMoveColumnRequest request) {
        KanbanBoardResponse board = kanbanService.moveColumn(request);
        return ApiResponse.<KanbanBoardResponse>builder()
                .result(board)
                .build();
    }

    // Task endpoints
    @PostMapping("/tasks")
    public ApiResponse<KanbanBoardResponse> createTask(@RequestBody @Valid KanbanTaskRequest request) {
        KanbanBoardResponse board = kanbanService.createTask(request);
        return ApiResponse.<KanbanBoardResponse>builder()
                .result(board)
                .build();
    }

    @PutMapping("/tasks/{taskId}")
    public ApiResponse<KanbanBoardResponse> updateTask(
            @PathVariable UUID taskId,
            @RequestBody @Valid KanbanTaskRequest request) {
        KanbanBoardResponse board = kanbanService.updateTask(taskId, request);
        return ApiResponse.<KanbanBoardResponse>builder()
                .result(board)
                .build();
    }

    @DeleteMapping("/tasks/{taskId}")
    public ApiResponse<KanbanBoardResponse> deleteTask(@PathVariable UUID taskId) {
        KanbanBoardResponse board = kanbanService.deleteTask(taskId);
        return ApiResponse.<KanbanBoardResponse>builder()
                .result(board)
                .build();
    }

    @PostMapping("/tasks/move")
    public ApiResponse<KanbanBoardResponse> moveTask(@RequestBody @Valid KanbanMoveTaskRequest request) {
        KanbanBoardResponse board = kanbanService.moveTask(request);
        return ApiResponse.<KanbanBoardResponse>builder()
                .result(board)
                .build();
    }
}