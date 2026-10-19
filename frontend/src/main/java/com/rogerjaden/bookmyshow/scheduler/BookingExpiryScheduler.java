package com.rogerjaden.bookmyshow.scheduler;

import com.rogerjaden.bookmyshow.entity.Booking;
import com.rogerjaden.bookmyshow.entity.enums.BookingStatus;
import com.rogerjaden.bookmyshow.repository.BookingRepository;
import com.rogerjaden.bookmyshow.service.interfaces.BookingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class BookingExpiryScheduler {

    private static final Logger log =
            LoggerFactory.getLogger(BookingExpiryScheduler.class);

    private final BookingRepository bookingRepository;
    private final BookingService bookingService;

    public BookingExpiryScheduler(
            BookingRepository bookingRepository,
            BookingService bookingService) {
        this.bookingRepository = bookingRepository;
        this.bookingService = bookingService;
    }

    @Scheduled(fixedDelay = 30000)
    public void expirePendingBookings() {
        List<Booking> expiredBookings =
                bookingRepository.findByStatusAndExpiresAtBefore(
                        BookingStatus.PENDING,
                        LocalDateTime.now()
                );

        for (Booking booking : expiredBookings) {
            try {
                bookingService.expireBooking(booking.getId());
                log.info("Expired booking {}", booking.getId());
            } catch (RuntimeException exception) {
                log.warn(
                        "Could not expire booking {}: {}",
                        booking.getId(),
                        exception.getMessage()
                );
            }
        }
    }
}