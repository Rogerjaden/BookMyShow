package com.rogerjaden.bookmyshow.dto.response;

import com.rogerjaden.bookmyshow.entity.enums.ScreenStatus;
import com.rogerjaden.bookmyshow.entity.enums.ScreenType;

public record ScreenResponse(
        Long id, Long theatreId, String screenName,
        ScreenType screenType, ScreenStatus status
) {}
