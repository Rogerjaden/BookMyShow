package com.rogerjaden.bookmyshow.dto.response;

import com.rogerjaden.bookmyshow.entity.enums.NotificationType;
import java.time.LocalDateTime;

public record NotificationResponse(
        Long id, String title, String message, NotificationType type,
        Long referenceId, boolean isRead, LocalDateTime createdAt
) {}
