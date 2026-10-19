package com.rogerjaden.bookmyshow.dto.response;

import java.time.LocalDateTime;

public record WishlistResponse(
        Long id, Long userId, Long movieId, String movieTitle,
        String posterUrl, LocalDateTime createdAt
) {}
