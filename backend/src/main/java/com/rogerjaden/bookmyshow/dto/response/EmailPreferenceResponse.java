package com.rogerjaden.bookmyshow.dto.response;

import java.time.LocalDateTime;

public record EmailPreferenceResponse(
        Long id, Long userId, boolean marketingEmailsEnabled,
        boolean bookingEmailsEnabled, LocalDateTime updatedAt
) {}
