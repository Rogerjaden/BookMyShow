package com.rogerjaden.bookmyshow.service.impl;

import com.rogerjaden.bookmyshow.entity.EmailVerificationToken;
import com.rogerjaden.bookmyshow.entity.User;
import com.rogerjaden.bookmyshow.repository.EmailVerificationTokenRepository;
import com.rogerjaden.bookmyshow.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class EmailVerificationServiceImplTest {

    private UserRepository userRepository;
    private EmailVerificationTokenRepository tokenRepository;
    private EmailServiceImpl emailService;
    private EmailVerificationServiceImpl verificationService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        tokenRepository = mock(EmailVerificationTokenRepository.class);
        emailService = mock(EmailServiceImpl.class);

        verificationService = new EmailVerificationServiceImpl(
                userRepository,
                tokenRepository,
                emailService,
                "http://localhost:5173"
        );
    }

    @Test
    void createAndSendVerificationSavesTokenAndSendsEmail() {
        User user = mock(User.class);
        when(user.getId()).thenReturn(1L);
        when(user.isEmailVerified()).thenReturn(false);
        when(user.getEmail()).thenReturn("test@example.com");
        when(user.getName()).thenReturn("Test User");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(tokenRepository.findByUser_Id(1L)).thenReturn(Optional.empty());

        when(tokenRepository.save(any(EmailVerificationToken.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        verificationService.createAndSendVerification(1L);

        verify(tokenRepository).save(any(EmailVerificationToken.class));
        verify(emailService).sendEmail(
                eq("test@example.com"),
                eq("Verify your BMS-Clone account"),
                contains("http://localhost:5173/verify-email?token=")
        );
    }

    @Test
    void createAndSendVerificationDoesNothingWhenEmailAlreadyVerified() {
        User user = mock(User.class);
        when(user.isEmailVerified()).thenReturn(true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        verificationService.createAndSendVerification(1L);

        verifyNoInteractions(tokenRepository, emailService);
    }

    @Test
    void createAndSendVerificationThrowsWhenUserDoesNotExist() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(
                IllegalArgumentException.class,
                () -> verificationService.createAndSendVerification(99L)
        );

        verifyNoInteractions(tokenRepository, emailService);
    }

    @Test
    void verifyEmailMarksUserVerifiedAndTokenUsed() {
        User user = mock(User.class);
        when(user.isEmailVerified()).thenReturn(false);

        EmailVerificationToken token = mock(EmailVerificationToken.class);
        when(token.getUsedAt()).thenReturn(null);
        when(token.getExpiresAt()).thenReturn(LocalDateTime.now().plusMinutes(10));
        when(token.getUser()).thenReturn(user);

        when(tokenRepository.findByTokenHash(anyString()))
                .thenReturn(Optional.of(token));

        verificationService.verifyEmail("sample-verification-token");

        verify(user).setEmailVerified(true);
        verify(token).setUsedAt(any(LocalDateTime.class));
        verify(userRepository).save(user);
        verify(tokenRepository).save(token);
    }

    @Test
    void verifyEmailRejectsBlankToken() {
        assertThrows(
                IllegalArgumentException.class,
                () -> verificationService.verifyEmail(" ")
        );

        verifyNoInteractions(tokenRepository);
    }

    @Test
    void verifyEmailRejectsExpiredToken() {
        EmailVerificationToken token = mock(EmailVerificationToken.class);

        when(token.getUsedAt()).thenReturn(null);
        when(token.getExpiresAt()).thenReturn(LocalDateTime.now().minusMinutes(1));
        when(tokenRepository.findByTokenHash(anyString()))
                .thenReturn(Optional.of(token));

        assertThrows(
                IllegalArgumentException.class,
                () -> verificationService.verifyEmail("expired-token")
        );

        verify(userRepository, never()).save(any());
        verify(tokenRepository, never()).save(any());
    }

    @Test
    void verifyEmailRejectsAlreadyUsedToken() {
        EmailVerificationToken token = mock(EmailVerificationToken.class);

        when(token.getUsedAt()).thenReturn(LocalDateTime.now().minusMinutes(1));
        when(tokenRepository.findByTokenHash(anyString()))
                .thenReturn(Optional.of(token));

        assertThrows(
                IllegalArgumentException.class,
                () -> verificationService.verifyEmail("used-token")
        );

        verify(userRepository, never()).save(any());
        verify(tokenRepository, never()).save(any());
    }

    @Test
    void resendVerificationDoesNotSendAgainDuringCooldown() {
        User user = mock(User.class);
        when(user.getId()).thenReturn(1L);
        when(user.isEmailVerified()).thenReturn(false);

        EmailVerificationToken existing = mock(EmailVerificationToken.class);
        when(existing.getLastSentAt()).thenReturn(LocalDateTime.now());

        when(userRepository.findByEmailIgnoreCase("test@example.com"))
                .thenReturn(Optional.of(user));
        when(tokenRepository.findByUser_Id(1L))
                .thenReturn(Optional.of(existing));

        verificationService.resendVerification("test@example.com");

        verify(tokenRepository, never()).save(any());
        verifyNoInteractions(emailService);
    }
}
