
package com.rogerjaden.bookmyshow.repository;

import com.rogerjaden.bookmyshow.entity.EmailVerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmailVerificationTokenRepository
        extends JpaRepository<EmailVerificationToken, Long> {

    Optional<EmailVerificationToken> findByTokenHash(String tokenHash);

    Optional<EmailVerificationToken> findByUser_Id(Long userId);

    void deleteByUser_Id(Long userId);
}
