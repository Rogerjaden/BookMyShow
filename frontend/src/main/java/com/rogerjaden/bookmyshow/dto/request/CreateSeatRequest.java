package com.rogerjaden.bookmyshow.dto.request;

import com.rogerjaden.bookmyshow.entity.enums.SeatStatus;
import com.rogerjaden.bookmyshow.entity.enums.SeatType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CreateSeatRequest(
        @NotNull Long screenId,
        @NotBlank @Size(max = 5) String rowLabel,
        @NotNull @Positive Integer seatNumber,
        @NotNull SeatType seatType,
        @NotNull SeatStatus status
) {}
