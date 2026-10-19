package com.rogerjaden.bookmyshow.service.impl;

import com.rogerjaden.bookmyshow.dto.response.UserResponse;
import com.rogerjaden.bookmyshow.entity.User;
import com.rogerjaden.bookmyshow.entity.enums.UserStatus;
import com.rogerjaden.bookmyshow.exception.ResourceNotFoundException;
import com.rogerjaden.bookmyshow.repository.UserRepository;
import com.rogerjaden.bookmyshow.service.interfaces.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;

    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getMyProfile() {
        return toResponse(getCurrentUser());
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        return toResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateMyProfile(String name, String phone) {
        User user = getCurrentUser();
        if (name != null && !name.isBlank()) {
            user.setName(name.trim());
        }
        if (phone != null) {
            String normalizedPhone = phone.trim();
            if (!normalizedPhone.isBlank() && userRepository.existsByPhone(normalizedPhone)
                    && !normalizedPhone.equals(user.getPhone())) {
                throw new IllegalArgumentException("Phone is already registered");
            }
            user.setPhone(normalizedPhone.isBlank() ? null : normalizedPhone);
        }
        return toResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public void deactivateMyAccount() {
        User user = getCurrentUser();
        user.setStatus(UserStatus.INACTIVE);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void changeUserStatus(Long userId, String status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        user.setStatus(UserStatus.valueOf(status.trim().toUpperCase()));
        userRepository.save(user);
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getName() == null) {
            throw new IllegalStateException("No authenticated user found");
        }
        return userRepository.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user was not found"));
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.getStatus(),
                user.isEmailVerified()
        );
    }
}
