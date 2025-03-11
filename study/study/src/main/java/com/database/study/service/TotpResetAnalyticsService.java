package com.database.study.service;

import com.database.study.entity.TotpResetRequest;
import com.database.study.repository.TotpResetRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class TotpResetAnalyticsService {

    private final TotpResetRequestRepository resetRequestRepository;

    public Map<String, Object> getTotpResetStatistics() {
        Map<String, Object> stats = new HashMap<>();
        
        LocalDateTime lastMonth = LocalDateTime.now().minusMonths(1);
        
        // Total requests
        long totalRequests = resetRequestRepository.count();
        
        // Pending requests
        long pendingRequests = resetRequestRepository.countByStatus(TotpResetRequest.RequestStatus.PENDING);
        
        // Requests in the last month
        long requestsLastMonth = resetRequestRepository.countByRequestTimeAfter(lastMonth);
        
        // Approved and rejected counts
        long approvedRequests = resetRequestRepository.countByStatus(TotpResetRequest.RequestStatus.APPROVED);
        long rejectedRequests = resetRequestRepository.countByStatus(TotpResetRequest.RequestStatus.REJECTED);
        
        // Average processing time (in hours)
        double avgProcessingTime = resetRequestRepository.findAverageProcessingTimeInHours();
        
        stats.put("totalRequests", totalRequests);
        stats.put("pendingRequests", pendingRequests);
        stats.put("requestsLastMonth", requestsLastMonth);
        stats.put("approvedRequests", approvedRequests);
        stats.put("rejectedRequests", rejectedRequests);
        stats.put("averageProcessingTimeHours", avgProcessingTime);
        
        return stats;
    }
    
    public Map<String, Long> getRequestStatusDistribution() {
        Map<String, Long> distribution = new HashMap<>();
        
        distribution.put("PENDING", resetRequestRepository.countByStatus(TotpResetRequest.RequestStatus.PENDING));
        distribution.put("APPROVED", resetRequestRepository.countByStatus(TotpResetRequest.RequestStatus.APPROVED));
        distribution.put("REJECTED", resetRequestRepository.countByStatus(TotpResetRequest.RequestStatus.REJECTED));
        
        return distribution;
    }
    
    public List<Map<String, Object>> getRequestsPerDay(int days) {
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);
        return resetRequestRepository.countRequestsPerDaySince(startDate);
    }
}