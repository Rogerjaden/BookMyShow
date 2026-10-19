package com.rogerjaden.bookmyshow.service.interfaces;

import com.rogerjaden.bookmyshow.dto.request.LoginRequest;
import com.rogerjaden.bookmyshow.dto.request.RefreshTokenRequest;
import com.rogerjaden.bookmyshow.dto.request.RegisterRequest;
import com.rogerjaden.bookmyshow.dto.response.AuthResponse;
import com.rogerjaden.bookmyshow.dto.response.UserResponse;

public interface AuthService {
    UserResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse refresh(RefreshTokenRequest request);
    void logout(RefreshTokenRequest request);
    void verifyEmail(String verificationToken);
    void resendEmailVerification(String email);
}
