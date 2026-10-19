package com.rogerjaden.bookmyshow.service.interfaces;

import com.rogerjaden.bookmyshow.dto.response.UserResponse;

public interface UserService {
    UserResponse getMyProfile();
    UserResponse getUserById(Long userId);
    UserResponse updateMyProfile(String name, String phone);
    void deactivateMyAccount();
    void changeUserStatus(Long userId, String status);
}
