package com.rogerjaden.bookmyshow.service.impl;

import com.rogerjaden.bookmyshow.dto.request.LoginRequest;
import com.rogerjaden.bookmyshow.dto.request.RefreshTokenRequest;
import com.rogerjaden.bookmyshow.dto.request.RegisterRequest;
import com.rogerjaden.bookmyshow.dto.response.AuthResponse;
import com.rogerjaden.bookmyshow.dto.response.UserResponse;
import com.rogerjaden.bookmyshow.entity.User;
import com.rogerjaden.bookmyshow.entity.enums.UserRole;
import com.rogerjaden.bookmyshow.entity.enums.UserStatus;
import com.rogerjaden.bookmyshow.mapper.UserMapper;
import com.rogerjaden.bookmyshow.repository.UserRepository;
import com.rogerjaden.bookmyshow.security.JWTService;
import com.rogerjaden.bookmyshow.service.interfaces.AuthService;
import com.rogerjaden.bookmyshow.service.interfaces.EmailVerificationService;
import com.rogerjaden.bookmyshow.service.interfaces.RefreshTokenService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JWTService jwtService;
    private final AuthenticationManager authenticationManager;
    private final RefreshTokenService refreshTokenService;
    private final EmailVerificationService emailVerificationService;

    public AuthServiceImpl(
            UserRepository userRepository,
            UserMapper userMapper,
            PasswordEncoder passwordEncoder,
            JWTService jwtService,
            AuthenticationManager authenticationManager,
            RefreshTokenService refreshTokenService,
            EmailVerificationService emailVerificationService) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.refreshTokenService = refreshTokenService;
        this.emailVerificationService = emailVerificationService;
    }

    @Override
    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email().trim())) {
            throw new IllegalArgumentException("Email is already registered");
        }

        if (request.phone() != null && !request.phone().isBlank()
                && userRepository.existsByPhone(request.phone().trim())) {
            throw new IllegalArgumentException("Phone is already registered");
        }

        User user = userMapper.toEntity(request);
        user.setName(request.name().trim());
        user.setEmail(request.email().trim().toLowerCase());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(UserRole.USER);
        user.setStatus(UserStatus.ACTIVE);
        user.setEmailVerified(false);

        User saved = userRepository.save(user);

        emailVerificationService.createAndSendVerification(user.getId());

        return new UserResponse(
                saved.getName(),
                saved.getEmail(),
                saved.getPhone(),
                saved.getRole(),
                saved.getStatus(),
                saved.isEmailVerified()
        );
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.email().trim().toLowerCase(),
                            request.password()
                    )
            );
        } catch (AuthenticationException exception) {
            throw exception;
        }

        User user = userRepository.findByEmailIgnoreCase(request.email().trim())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new DisabledException("This account is not active");
        }

        String accessToken = jwtService.generateToken(user.getEmail(), user.getRole());
        String refreshToken = refreshTokenService.createRefreshToken(user.getId());

        return new AuthResponse(accessToken, refreshToken, "Bearer", jwtService.getAccessTokenExpirationMs());
    }

    @Override
    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        String rawRefreshToken = request.refreshToken();
        Long userId = refreshTokenService.validateRefreshToken(rawRefreshToken);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.getStatus() != UserStatus.ACTIVE) {
            refreshTokenService.revokeRefreshToken(rawRefreshToken);
            throw new IllegalArgumentException("This account is not active");
        }

        if (!user.isEmailVerified()) {
            throw new DisabledException(
                    "Please verify your email before refreshing tokens"
            );
        }

        refreshTokenService.revokeRefreshToken(rawRefreshToken);
        String newRefreshToken = refreshTokenService.createRefreshToken(user.getId());
        String newAccessToken = jwtService.generateToken(user.getEmail(), user.getRole());

        return new AuthResponse(
                newAccessToken,
                newRefreshToken,
                "Bearer",
                jwtService.getAccessTokenExpirationMs()
        );
    }

    @Override
    public void logout(RefreshTokenRequest request) {
        refreshTokenService.revokeRefreshToken(request.refreshToken());
    }

    @Override
    public void verifyEmail(String verificationToken) {
        emailVerificationService.verifyEmail(verificationToken);
    }

    @Override
    public void resendEmailVerification(String email) {
        emailVerificationService.resendVerification(email);
    }
}
