package com.rogerjaden.bookmyshow.repository;

import com.rogerjaden.bookmyshow.entity.BookingSeat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookingSeatRepository extends JpaRepository<BookingSeat, Long> {
    List<BookingSeat> findByBooking_Id(Long bookingId);
    boolean existsByBooking_IdAndShowSeat_Id(Long bookingId, Long showSeatId);
    boolean existsByShowSeat_Id(Long showSeatId);
}
