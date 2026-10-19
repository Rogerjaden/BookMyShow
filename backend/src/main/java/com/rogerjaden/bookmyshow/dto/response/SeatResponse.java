package com.rogerjaden.bookmyshow.dto.response;

import com.rogerjaden.bookmyshow.entity.enums.SeatStatus;
import com.rogerjaden.bookmyshow.entity.enums.SeatType;

public record SeatResponse(
        Long id, Long screenId, String rowLabel,
        Integer seatNumber, SeatType seatType, SeatStatus status
) {}
