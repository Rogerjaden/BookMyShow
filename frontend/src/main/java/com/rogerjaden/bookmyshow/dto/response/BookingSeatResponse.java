package com.rogerjaden.bookmyshow.dto.response;

import java.math.BigDecimal;

public record BookingSeatResponse(
        Long id, Long showSeatId, String rowLabel,
        Integer seatNumber, BigDecimal priceAtBooking
) {}
