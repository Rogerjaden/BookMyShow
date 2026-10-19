package com.rogerjaden.bookmyshow.dto.response;

import com.rogerjaden.bookmyshow.entity.enums.MovieStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record MovieResponse(
        Long id, String title, String description, Integer durationMinutes,
        LocalDate releaseDate, String language, String certificate,
        String posterUrl, String trailerUrl, MovieStatus status,
        List<GenreSummaryResponse> genres,
        LocalDateTime createdAt, LocalDateTime updatedAt
) {}
