package com.rogerjaden.bookmyshow.repository;

import com.rogerjaden.bookmyshow.entity.Notification;
import com.rogerjaden.bookmyshow.entity.enums.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    Page<Notification> findByUser_IdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Page<Notification> findByUser_IdAndIsReadFalseOrderByCreatedAtDesc(
            Long userId, Pageable pageable);
    long countByUser_IdAndIsReadFalse(Long userId);
    List<Notification> findAllByUser_Status(UserStatus status);
}
