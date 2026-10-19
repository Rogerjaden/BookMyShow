package com.rogerjaden.bookmyshow.dto.request;

import com.rogerjaden.bookmyshow.entity.enums.TheatreStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateTheatreRequest(
        @NotBlank @Size(max = 150) String name,
        @NotBlank @Size(max = 255) String addressLine,
        @NotBlank @Size(max = 100) String city,
        @NotBlank @Size(max = 100) String state,
        @NotBlank @Size(max = 15) String postalCode,
        @NotNull TheatreStatus status
) {}
