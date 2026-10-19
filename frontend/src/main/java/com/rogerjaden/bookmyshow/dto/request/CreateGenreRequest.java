package com.rogerjaden.bookmyshow.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateGenreRequest(
        @NotBlank @Size(max = 100) String name,
        @Size(max = 1000) String description
) {}
