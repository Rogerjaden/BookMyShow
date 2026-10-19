package com.rogerjaden.bookmyshow.dto.request;

import com.rogerjaden.bookmyshow.entity.enums.MovieStatus;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.List;

public record CreateMovieRequest(
        @NotBlank @Size(max = 255) String title,
        String description,
        @NotNull @Positive Integer durationMinutes,
        LocalDate releaseDate,
        @NotBlank @Size(max = 50) String language,
        @Size(max = 20) String certificate,
        @Size(max = 2048) String posterUrl,
        @Size(max = 2048) String trailerUrl,
        @NotNull MovieStatus status,
        @NotEmpty List<@NotNull @Positive Long> genreIds
) {}
