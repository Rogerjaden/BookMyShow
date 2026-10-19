package com.rogerjaden.bookmyshow.dto.response;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long accessTokenExpiresInMs
) {}
