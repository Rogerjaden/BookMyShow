package com.rogerjaden.bookmyshow.dto.response;

import com.rogerjaden.bookmyshow.entity.enums.TheatreStatus;
import java.time.LocalDateTime;

public record TheatreResponse(
        Long id, String name, String addressLine, String city, String state,
        String postalCode, TheatreStatus status,
        LocalDateTime createdAt, LocalDateTime updatedAt
) {}
