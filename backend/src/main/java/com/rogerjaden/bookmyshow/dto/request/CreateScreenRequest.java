package com.rogerjaden.bookmyshow.dto.request;

import com.rogerjaden.bookmyshow.entity.enums.ScreenStatus;
import com.rogerjaden.bookmyshow.entity.enums.ScreenType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateScreenRequest(
        @NotNull Long theatreId,
        @NotBlank @Size(max = 100) String screenName,
        @NotNull ScreenType screenType,
        @NotNull ScreenStatus status
) {}
