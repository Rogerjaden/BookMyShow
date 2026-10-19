package com.rogerjaden.bookmyshow.service.interfaces;

public interface RefreshTokenService {

    String createRefreshToken(Long userId);

    Long validateRefreshToken(String rawToken);

    void revokeRefreshToken(String rawToken);

    void revokeAllUserRefreshTokens(Long userId);

    void deleteExpiredTokens();
}
