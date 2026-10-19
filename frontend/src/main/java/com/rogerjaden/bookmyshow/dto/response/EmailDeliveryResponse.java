package com.rogerjaden.bookmyshow.dto.response;

import com.rogerjaden.bookmyshow.entity.enums.EmailDeliveryStatus;
import java.time.LocalDateTime;

public record EmailDeliveryResponse(
        Long id, String eventType, Long referenceId, String recipientEmail,
        EmailDeliveryStatus status, Integer attemptCount,
        String lastError, LocalDateTime sentAt,
        LocalDateTime createdAt, LocalDateTime updatedAt
) {}
