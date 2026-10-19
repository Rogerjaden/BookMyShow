package com.rogerjaden.bookmyshow.service.impl;

import com.rogerjaden.bookmyshow.dto.request.LoginRequest;
import com.rogerjaden.bookmyshow.dto.request.RefreshTokenRequest;
import com.rogerjaden.bookmyshow.dto.response.AuthResponse;
import com.rogerjaden.bookmyshow.entity.User;
import com.rogerjaden.bookmyshow.entity.enums.UserRole;
import com.rogerjaden.bookmyshow.entity.enums.UserStatus;
import com.rogerjaden.bookmyshow.mapper.UserMapper;
import com.rogerjaden.bookmyshow.repository.UserRepository;
import com.rogerjaden.bookmyshow.security.JWTService;
import com.rogerjaden.bookmyshow.service.interfaces.EmailVerificationService;
import com.rogerjaden.bookmyshow.service.interfaces.RefreshTokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AuthServiceImplTest {

    private UserRepository userRepository;
    private UserMapper userMapper;
    private PasswordEncoder passwordEncoder;
    private JWTService jwtService;
    private AuthenticationManager authenticationManager;
    private RefreshTokenService refreshTokenService;
    private EmailVerificationService emailVerificationService;
    private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        userMapper = mock(UserMapper.class);
        passwordEncoder = mock(PasswordEncoder.class);
        jwtService = mock(JWTService.class);
        authenticationManager = mock(AuthenticationManager.class);
        refreshTokenService = mock(RefreshTokenService.class);
        emailVerificationService = mock(EmailVerificationService.class);

        authService = new AuthServiceImpl(
                userRepository,
                userMapper,
                passwordEncoder,
                jwtService,
                authenticationManager,
                refreshTokenService,
                emailVerificationService
        );
    }

    @Test
    void loginRejectsUnverifiedUser() {
        LoginRequest request = mock(LoginRequest.class);
        when(request.email()).thenReturn("test@example.com");
        when(request.password()).thenReturn("password");

        when(authenticationManager.authenticate(
                any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new DisabledException("Please verify your email"));

        assertThrows(DisabledException.class, () -> authService.login(request));

        verify(jwtService, never()).generateToken(anyString(), any(UserRole.class));
        verify(refreshTokenService, never()).createRefreshToken(anyLong());
    }

    @Test
    void loginCreatesTokensForVerifiedUser() {
        LoginRequest request = mock(LoginRequest.class);
        when(request.email()).thenReturn("test@example.com");
        when(request.password()).thenReturn("password");

        Authentication authentication = mock(Authentication.class);
        when(authenticationManager.authenticate(
                any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);

        User user = mock(User.class);
        when(user.getEmail()).thenReturn("test@example.com");
        when(user.getRole()).thenReturn(UserRole.USER);
        when(user.getStatus()).thenReturn(UserStatus.ACTIVE);
        when(user.isEmailVerified()).thenReturn(true);
        when(userRepository.findByEmailIgnoreCase("test@example.com"))
                .thenReturn(Optional.of(user));

        when(jwtService.generateToken("test@example.com", UserRole.USER))
                .thenReturn("access-token");
        when(jwtService.getAccessTokenExpirationMs()).thenReturn(900000L);
        when(refreshTokenService.createRefreshToken(any()))
                .thenReturn("refresh-token");

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("access-token", response.accessToken());
        assertEquals("refresh-token", response.refreshToken());
    }

    @Test
    void refreshRejectsUnverifiedUser() {
        RefreshTokenRequest request = mock(RefreshTokenRequest.class);
        when(request.refreshToken()).thenReturn("refresh-token");
        when(refreshTokenService.validateRefreshToken("refresh-token"))
                .thenReturn(1L);

        User user = mock(User.class);
        when(user.getStatus()).thenReturn(UserStatus.ACTIVE);
        when(user.isEmailVerified()).thenReturn(false);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        assertThrows(DisabledException.class, () -> authService.refresh(request));

        verify(jwtService, never()).generateToken(anyString(), any(UserRole.class));
        verify(refreshTokenService, never()).createRefreshToken(anyLong());
    }


    @Test
    void refreshCreatesNewTokensForVerifiedUser() {
        RefreshTokenRequest request = mock(RefreshTokenRequest.class);
        when(request.refreshToken()).thenReturn("old-refresh-token");

        when(refreshTokenService.validateRefreshToken(anyString()))
                .thenReturn(1L);

        User user = mock(User.class);
        when(user.getId()).thenReturn(1L);
        when(user.getStatus()).thenReturn(UserStatus.ACTIVE);
        when(user.isEmailVerified()).thenReturn(true);
        when(user.getEmail()).thenReturn("test@example.com");
        when(user.getRole()).thenReturn(UserRole.USER);

        when(userRepository.findById(1L))
                .thenReturn(Optional.of(user));

        when(refreshTokenService.createRefreshToken(anyLong()))
                .thenReturn("new-refresh-token");

        when(jwtService.generateToken("test@example.com", UserRole.USER))
                .thenReturn("new-access-token");

        when(jwtService.getAccessTokenExpirationMs())
                .thenReturn(900000L);

        AuthResponse response = authService.refresh(request);

        assertNotNull(response);
        assertEquals("new-access-token", response.accessToken());
        assertEquals("new-refresh-token", response.refreshToken());

        verify(refreshTokenService).validateRefreshToken("old-refresh-token");
        verify(refreshTokenService).revokeRefreshToken("old-refresh-token");
        verify(refreshTokenService).createRefreshToken(1L);
    }

}
