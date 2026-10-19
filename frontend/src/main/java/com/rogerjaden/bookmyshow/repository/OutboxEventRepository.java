package com.rogerjaden.bookmyshow.repository;

import com.rogerjaden.bookmyshow.entity.OutboxEvent;
import com.rogerjaden.bookmyshow.entity.enums.OutboxStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface OutboxEventRepository extends JpaRepository<OutboxEvent, Long> {
    List<OutboxEvent> findByStatusAndNextAttemptAtLessThanEqualOrderByCreatedAtAsc(
            OutboxStatus status, LocalDateTime now, Pageable pageable);

    List<OutboxEvent> findByStatusOrderByCreatedAtAsc(
            OutboxStatus status, Pageable pageable);

    long countByStatus(OutboxStatus status);
}
