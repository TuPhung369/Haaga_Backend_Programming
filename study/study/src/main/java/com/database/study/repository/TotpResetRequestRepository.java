package com.database.study.repository;

import com.database.study.entity.TotpResetRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.database.study.entity.TotpResetRequest.RequestStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Repository
public interface TotpResetRequestRepository extends JpaRepository<TotpResetRequest, UUID> {
       // Existing methods
       List<TotpResetRequest> findByStatus(RequestStatus status);

       List<TotpResetRequest> findByUsernameOrderByRequestTimeDesc(String username);

       List<TotpResetRequest> findByStatusOrderByRequestTimeDesc(TotpResetRequest.RequestStatus status);

       List<TotpResetRequest> findAllByOrderByRequestTimeDesc();

       List<TotpResetRequest> findByProcessedTrueAndProcessedTimeBefore(LocalDateTime cutoffDate);

       // Count methods for analytics
       long countByStatus(TotpResetRequest.RequestStatus status);

       long countByRequestTimeAfter(LocalDateTime date);

       // Method to calculate average processing time in hours
       @Query(value = "SELECT COALESCE(AVG(TIMESTAMPDIFF(HOUR, request_time, processed_time)), 0) " +
                     "FROM totp_reset_requests " +
                     "WHERE processed = true AND processed_time IS NOT NULL", nativeQuery = true)
       double findAverageProcessingTimeInHours();

       // Method to count requests per day for a date range
       @Query(value = "SELECT DATE_FORMAT(request_time, '%Y-%m-%d') AS date, COUNT(*) AS count " +
                     "FROM totp_reset_requests " +
                     "WHERE request_time >= :startDate " +
                     "GROUP BY DATE_FORMAT(request_time, '%Y-%m-%d') " +
                     "ORDER BY date", nativeQuery = true)
       List<Map<String, Object>> countRequestsPerDaySince(@Param("startDate") LocalDateTime startDate);
}