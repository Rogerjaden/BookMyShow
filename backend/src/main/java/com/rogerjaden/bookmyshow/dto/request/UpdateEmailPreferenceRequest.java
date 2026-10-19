package com.rogerjaden.bookmyshow.dto.request;

public record UpdateEmailPreferenceRequest(
        boolean marketingEmailsEnabled,
        boolean bookingEmailsEnabled
) {}
