package com.rogerjaden.bookmyshow.dto.request;

import com.rogerjaden.bookmyshow.entity.enums.MovieStatus;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.List;

public record UpdateMovieRequest(
        @Size(max = 255) String title,
        String description,
        @Positive Integer durationMinutes,
        LocalDate releaseDate,
        @Size(max = 50) String language,
        @Size(max = 20) String certificate,
        @Size(max = 2048) String posterUrl,
        @Size(max = 2048) String trailerUrl,
        MovieStatus status,
        List<@NotNull @Positive Long> genreIds
) {}