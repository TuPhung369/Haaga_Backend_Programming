// KanbanColumn.java
package com.database.study.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Table(name = "kanban_columns")
public class KanbanColumn {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @Column(nullable = false)
    String title;

    @Column(nullable = false)
    int position;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    KanbanBoard board;

    @OneToMany(mappedBy = "column", cascade = CascadeType.ALL)
    @OrderBy("position ASC")
    @Builder.Default
    List<KanbanTask> tasks = new ArrayList<>();

    // For comparison in equals() without infinite recursion
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof KanbanColumn)) return false;
        KanbanColumn that = (KanbanColumn) o;
        return id != null && id.equals(that.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "KanbanColumn(id=" + id + ", title=" + title + ", position=" + position + ")";
    }
}