package com.rogerjaden.bookmyshow.dto.request;

import jakarta.validation.constraints.NotNull;

public record MarkNotificationReadRequest(@NotNull Boolean isRead) {}
