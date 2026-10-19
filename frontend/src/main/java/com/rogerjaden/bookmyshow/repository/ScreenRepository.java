package com.rogerjaden.bookmyshow.repository;

import com.rogerjaden.bookmyshow.entity.Screen;
import com.rogerjaden.bookmyshow.entity.enums.ScreenStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ScreenRepository extends JpaRepository<Screen, Long> {
    List<Screen> findByTheatre_Id(Long theatreId);
    List<Screen> findByTheatre_IdAndStatus(Long theatreId, ScreenStatus status);
    boolean existsByTheatre_IdAndScreenNameIgnoreCase(Long theatreId, String screenName);
}
