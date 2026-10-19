package com.rogerjaden.bookmyshow.dto.response;

import com.rogerjaden.bookmyshow.entity.enums.UserRole;
import com.rogerjaden.bookmyshow.entity.enums.UserStatus;
import java.time.LocalDateTime;

public record UserResponse(
        String name, String email, String phone,
        UserRole role, UserStatus status, boolean emailVerified
) {}
