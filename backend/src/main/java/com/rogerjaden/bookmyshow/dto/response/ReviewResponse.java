package com.rogerjaden.bookmyshow.dto.response;

import java.time.LocalDateTime;

public record ReviewResponse(
        Long id, Long userId, String userName, Long movieId,
        Integer rating, String comment,
        LocalDateTime createdAt, LocalDateTime updatedAt
) {}
