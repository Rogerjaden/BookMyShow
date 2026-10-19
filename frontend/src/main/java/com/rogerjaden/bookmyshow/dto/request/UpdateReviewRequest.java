package com.rogerjaden.bookmyshow.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateReviewRequest(
        @NotNull @Min(1) @Max(10) Integer rating,
        @Size(max = 5000) String comment
) {}
