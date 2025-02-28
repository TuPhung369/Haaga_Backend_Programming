// KanbanTask.java
package com.database.study.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Table(name = "kanban_tasks")
public class KanbanTask {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @Column(nullable = false)
    String title;

    String description;

    @Column(nullable = false)
    String priority;

    @Column(nullable = false)
    int position;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "column_id", nullable = false)
    KanbanColumn column;

    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // For comparison in equals() without infinite recursion
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof KanbanTask)) return false;
        KanbanTask that = (KanbanTask) o;
        return id != null && id.equals(that.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "KanbanTask(id=" + id + ", title=" + title + ", priority=" + priority + ", position=" + position + ")";
    }
}