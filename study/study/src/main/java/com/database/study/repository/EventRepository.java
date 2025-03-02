package com.database.study.repository;

import com.database.study.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EventRepository extends JpaRepository<Event, String> {
    List<Event> findByUserId(UUID userId);

    List<Event> findBySeriesId(String seriesId);
    void deleteByUserId(UUID userId);
}