package com.rogerjaden.bookmyshow.dto.response;

import com.rogerjaden.bookmyshow.entity.enums.PaymentMethod;
import com.rogerjaden.bookmyshow.entity.enums.PaymentStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentResponse(
        Long id, Long bookingId, BigDecimal amount,
        PaymentStatus status, PaymentMethod paymentMethod,
        String providerReference, String failureReason,
        LocalDateTime paidAt, LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
