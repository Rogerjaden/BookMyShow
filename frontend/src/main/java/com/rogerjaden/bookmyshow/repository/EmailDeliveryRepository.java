package com.rogerjaden.bookmyshow.repository;

import com.rogerjaden.bookmyshow.entity.EmailDelivery;
import com.rogerjaden.bookmyshow.entity.enums.EmailDeliveryStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmailDeliveryRepository extends JpaRepository<EmailDelivery, Long> {
    Optional<EmailDelivery> findByIdempotencyKey(String idempotencyKey);
    Page<EmailDelivery> findByUser_IdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Page<EmailDelivery> findByStatusOrderByCreatedAtAsc(
            EmailDeliveryStatus status, Pageable pageable);
    boolean existsByIdempotencyKey(String idempotencyKey);
}
