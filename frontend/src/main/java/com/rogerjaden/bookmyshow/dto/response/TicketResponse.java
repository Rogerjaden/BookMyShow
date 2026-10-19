
package com.rogerjaden.bookmyshow.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record TicketResponse(
        Long bookingId,
        String bookingReference,
        String bookingStatus,
        String paymentStatus,
        String movieTitle,
        String language,
        String format,
        String theatreName,
        String screenName,
        LocalDateTime showStartTime,
        BigDecimal totalAmount,
        List<String> seats
) {}
