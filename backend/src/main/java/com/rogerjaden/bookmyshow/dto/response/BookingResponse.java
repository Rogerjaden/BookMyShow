package com.rogerjaden.bookmyshow.dto.response;

import com.rogerjaden.bookmyshow.entity.enums.BookingStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record BookingResponse(
        Long id, String bookingReference, Long userId,
        Long movieShowId, String movieTitle, String theatreName,
        LocalDateTime showStartTime, BigDecimal totalAmount,
        BookingStatus status, LocalDateTime expiresAt,
        LocalDateTime confirmedAt, List<BookingSeatResponse> seats,
        LocalDateTime createdAt, LocalDateTime updatedAt
) {}
