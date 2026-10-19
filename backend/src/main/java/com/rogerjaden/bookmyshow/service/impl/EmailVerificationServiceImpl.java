package com.rogerjaden.bookmyshow.service.impl;

import com.rogerjaden.bookmyshow.entity.EmailVerificationToken;
import com.rogerjaden.bookmyshow.entity.User;
import com.rogerjaden.bookmyshow.repository.EmailVerificationTokenRepository;
import com.rogerjaden.bookmyshow.repository.UserRepository;
import com.rogerjaden.bookmyshow.service.interfaces.EmailVerificationService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

@Service
public class EmailVerificationServiceImpl implements EmailVerificationService {

    private static final int TOKEN_BYTES = 32;
    private static final int TOKEN_EXPIRY_MINUTES = 30;
    private static final int RESEND_COOLDOWN_SECONDS = 60;

    private final UserRepository userRepository;
    private final EmailVerificationTokenRepository tokenRepository;
    private final EmailServiceImpl emailService;
    private final String frontendBaseUrl;

    @Value("${app.email.mock-delivery:false}")
    private boolean mockDelivery;

    private final SecureRandom secureRandom = new SecureRandom();

    public EmailVerificationServiceImpl(
            UserRepository userRepository,
            EmailVerificationTokenRepository tokenRepository,
            EmailServiceImpl emailService,
            @Value("${app.frontend.base-url:http://localhost:5173}")
            String frontendBaseUrl) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.emailService = emailService;
        this.frontendBaseUrl = frontendBaseUrl.replaceAll("/+$", "");
    }

    @Override
    @Transactional
    public void createAndSendVerification(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.isEmailVerified()) {
            return;
        }

        issueToken(user, false);
    }

    @Override
    @Transactional
    public void verifyEmail(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new IllegalArgumentException("Invalid or expired verification link");
        }

        EmailVerificationToken token = tokenRepository
                .findByTokenHash(hashToken(rawToken))
                .orElseThrow(() -> new IllegalArgumentException(
                        "Invalid or expired verification link"));

        LocalDateTime now = LocalDateTime.now();

        if (token.getUsedAt() != null || !token.getExpiresAt().isAfter(now)) {
            throw new IllegalArgumentException("Invalid or expired verification link");
        }

        User user = token.getUser();
        user.setEmailVerified(true);
        token.setUsedAt(now);

        userRepository.save(user);
        tokenRepository.save(token);
    }

    @Override
    @Transactional
    public void resendVerification(String email) {
        if (email == null || email.isBlank()) {
            return;
        }

        userRepository.findByEmailIgnoreCase(email.trim())
                .filter(user -> !user.isEmailVerified())
                .ifPresent(user -> issueToken(user, true));
    }

    private void issueToken(User user, boolean enforceCooldown) {
        LocalDateTime now = LocalDateTime.now();

        EmailVerificationToken existing = tokenRepository
                .findByUser_Id(user.getId())
                .orElse(null);

        if (existing != null && enforceCooldown
                && existing.getLastSentAt() != null
                && existing.getLastSentAt().isAfter(
                now.minusSeconds(RESEND_COOLDOWN_SECONDS))) {
            return;
        }

        byte[] randomBytes = new byte[TOKEN_BYTES];
        secureRandom.nextBytes(randomBytes);

        String rawToken = Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(randomBytes);

        if (existing == null) {
            existing = new EmailVerificationToken();
            existing.setUser(user);
        }

        existing.setTokenHash(hashToken(rawToken));
        existing.setExpiresAt(now.plusMinutes(TOKEN_EXPIRY_MINUTES));
        existing.setUsedAt(null);
        existing.setLastSentAt(now);

        tokenRepository.save(existing);

        String verificationUrl = frontendBaseUrl
                + "/verify-email?token="
                + rawToken;

        String body = "Hello " + user.getName() + ",\n\n"
                + "Verify your email using the link below:\n\n"
                + verificationUrl + "\n\n"
                + "This link expires in 30 minutes. "
                + "If you did not create this account, ignore this email.";


        if (mockDelivery) {
            System.out.println("EMAIL DELIVERY MOCKED");
            System.out.println("To: " + user.getEmail());
            System.out.println("Subject: Verify your BMS-Clone account");
            System.out.println(body);
        } else {
            emailService.sendEmail(
                    user.getEmail(),
                    "Verify your BMS-Clone account",
                    body
            );
        }
    }

    private String hashToken(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8));

            return java.util.HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(
                    "SHA-256 is not available", exception);
        }
    }
}
