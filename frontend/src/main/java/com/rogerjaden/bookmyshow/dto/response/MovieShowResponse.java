package com.rogerjaden.bookmyshow.dto.response;

import com.rogerjaden.bookmyshow.entity.enums.MovieFormat;
import com.rogerjaden.bookmyshow.entity.enums.ShowStatus;
import java.time.LocalDateTime;

public record MovieShowResponse(
        Long id, Long movieId, String movieTitle,
        Long screenId, String screenName, Long theatreId, String theatreName,
        String city, LocalDateTime startTime, LocalDateTime endTime,
        String language, MovieFormat format, ShowStatus status,
        LocalDateTime createdAt, LocalDateTime updatedAt
) {}
