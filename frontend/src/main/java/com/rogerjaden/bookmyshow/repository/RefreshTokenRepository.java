package com.rogerjaden.bookmyshow.repository;

import com.rogerjaden.bookmyshow.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByTokenHash(String tokenHash);
    List<RefreshToken> findByUser_Id(Long userId);
    List<RefreshToken> findByUser_IdAndIsRevokedFalse(Long userId);
    boolean existsByTokenHash(String tokenHash);
    void deleteByExpiresAtBefore(LocalDateTime now);
}
