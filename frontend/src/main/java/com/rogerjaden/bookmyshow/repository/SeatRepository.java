package com.rogerjaden.bookmyshow.repository;

import com.rogerjaden.bookmyshow.entity.Seat;
import com.rogerjaden.bookmyshow.entity.enums.SeatStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SeatRepository extends JpaRepository<Seat, Long> {
    List<Seat> findByScreen_Id(Long screenId);
    List<Seat> findByScreen_IdAndStatus(Long screenId, SeatStatus status);
    boolean existsByScreen_IdAndRowLabelIgnoreCaseAndSeatNumber(
            Long screenId, String rowLabel, Integer seatNumber);
    long countByScreen_Id(Long screenId);
}
