package com.rogerjaden.bookmyshow.dto.response;

import com.rogerjaden.bookmyshow.entity.enums.SeatType;
import com.rogerjaden.bookmyshow.entity.enums.ShowSeatStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ShowSeatResponse(
        Long id, Long movieShowId, Long seatId, String rowLabel,
        Integer seatNumber, SeatType seatType, BigDecimal price,
        ShowSeatStatus status, LocalDateTime lockedUntil
) {}
