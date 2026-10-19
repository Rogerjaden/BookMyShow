package com.rogerjaden.bookmyshow.mapper;

import com.rogerjaden.bookmyshow.dto.request.RegisterRequest;
import com.rogerjaden.bookmyshow.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {
    public User toEntity(RegisterRequest dto) {

        User user = new User();

        user.setName(dto.name());
        user.setEmail(dto.email());
        user.setPhone(dto.phone());

        return user;
    }
}
