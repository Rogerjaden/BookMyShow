package com.rogerjaden.bookmyshow.repository;

import com.rogerjaden.bookmyshow.entity.User;
import com.rogerjaden.bookmyshow.entity.enums.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByPhone(String phone);
    List<User> findAllByStatus(UserStatus status);
}
