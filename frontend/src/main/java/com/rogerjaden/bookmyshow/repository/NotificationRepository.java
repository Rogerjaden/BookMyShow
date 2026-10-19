package com.rogerjaden.bookmyshow.repository;

import com.rogerjaden.bookmyshow.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    Page<Notification> findByUser_IdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Page<Notification> findByUser_IdAndIsReadFalseOrderByCreatedAtDesc(
            Long userId, Pageable pageable);
    long countByUser_IdAndIsReadFalse(Long userId);
}
