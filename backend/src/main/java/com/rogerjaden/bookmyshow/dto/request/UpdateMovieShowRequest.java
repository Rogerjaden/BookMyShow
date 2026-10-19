package com.rogerjaden.bookmyshow.dto.request;

import com.rogerjaden.bookmyshow.entity.enums.MovieFormat;
import com.rogerjaden.bookmyshow.entity.enums.ShowStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

public record UpdateMovieShowRequest(
        @NotNull LocalDateTime startTime,
        @NotNull LocalDateTime endTime,
        @NotBlank @Size(max = 50) String language,
        @NotNull MovieFormat format,
        @NotNull ShowStatus status
) {}
