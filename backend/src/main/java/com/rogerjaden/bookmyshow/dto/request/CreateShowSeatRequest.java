package com.rogerjaden.bookmyshow.dto.request;

import com.rogerjaden.bookmyshow.entity.enums.ShowSeatStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;

public record CreateShowSeatRequest(
        @NotNull Long movieShowId,
        @NotNull Long seatId,
        @NotNull @PositiveOrZero BigDecimal price,
        @NotNull ShowSeatStatus status
) {}
