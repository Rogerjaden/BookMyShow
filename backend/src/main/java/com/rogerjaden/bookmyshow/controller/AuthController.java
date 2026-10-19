package com.rogerjaden.bookmyshow.controller;

import com.rogerjaden.bookmyshow.dto.request.LoginRequest;
import com.rogerjaden.bookmyshow.dto.request.RefreshTokenRequest;
import com.rogerjaden.bookmyshow.dto.request.RegisterRequest;
import com.rogerjaden.bookmyshow.dto.response.AuthResponse;
import com.rogerjaden.bookmyshow.dto.response.UserResponse;
import com.rogerjaden.bookmyshow.service.interfaces.AuthService;
import com.rogerjaden.bookmyshow.service.interfaces.EmailVerificationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@Validated
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final EmailVerificationService emailVerificationService;

    public AuthController(
            AuthService authService,
            EmailVerificationService emailVerificationService) {
        this.authService = authService;
        this.emailVerificationService = emailVerificationService;
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(
            @Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refresh(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            @Valid @RequestBody RefreshTokenRequest request) {
        authService.logout(request);
        return ResponseEntity.ok(
                Map.of("message", "Logged out successfully"));
    }

    @GetMapping("/verify-email")
    public ResponseEntity<Map<String, String>> verifyEmail(
            @RequestParam String token) {
        authService.verifyEmail(token);
        return ResponseEntity.ok(
                Map.of("message", "Email verified successfully")
        );
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<Map<String, String>> resendVerification(
            @RequestBody Map<String, String> request) {
        authService.resendEmailVerification(request.get("email"));
        return ResponseEntity.ok(
                Map.of("message",
                        "If the account requires verification, instructions will be sent.")
        );
    }

    public record ResendVerificationRequest(
            @NotBlank @Email String email) {
    }
}
