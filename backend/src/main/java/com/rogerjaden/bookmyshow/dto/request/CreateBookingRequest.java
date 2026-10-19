package com.rogerjaden.bookmyshow.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.util.List;

public record CreateBookingRequest(
        @NotNull @Positive Long movieShowId,
        @NotEmpty List<@NotNull @Positive Long> showSeatIds
) {}
