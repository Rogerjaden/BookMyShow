package com.rogerjaden.bookmyshow.dto.request;

import com.rogerjaden.bookmyshow.entity.enums.NotificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record BroadcastNotificationRequest(
        @NotBlank
        @Size(max = 180)
        String title,

        @NotBlank
        String message,

        @NotNull
        NotificationType type
) {}