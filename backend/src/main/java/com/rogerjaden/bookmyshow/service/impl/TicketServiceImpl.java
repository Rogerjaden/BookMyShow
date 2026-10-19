
package com.rogerjaden.bookmyshow.service.impl;

import com.rogerjaden.bookmyshow.dto.response.TicketResponse;
import com.rogerjaden.bookmyshow.entity.Booking;
import com.rogerjaden.bookmyshow.entity.BookingSeat;
import com.rogerjaden.bookmyshow.entity.Payment;
import com.rogerjaden.bookmyshow.entity.enums.BookingStatus;
import com.rogerjaden.bookmyshow.entity.enums.PaymentStatus;
import com.rogerjaden.bookmyshow.exception.ResourceNotFoundException;
import com.rogerjaden.bookmyshow.repository.BookingRepository;
import com.rogerjaden.bookmyshow.repository.BookingSeatRepository;
import com.rogerjaden.bookmyshow.repository.PaymentRepository;
import com.rogerjaden.bookmyshow.service.interfaces.TicketService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TicketServiceImpl implements TicketService {

    private final BookingRepository bookingRepository;
    private final BookingSeatRepository bookingSeatRepository;
    private final PaymentRepository paymentRepository;

    public TicketServiceImpl(
            BookingRepository bookingRepository,
            BookingSeatRepository bookingSeatRepository,
            PaymentRepository paymentRepository) {
        this.bookingRepository = bookingRepository;
        this.bookingSeatRepository = bookingSeatRepository;
        this.paymentRepository = paymentRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public TicketResponse getTicket(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Booking not found: " + bookingId));

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getName() == null
                || "anonymousUser".equals(authentication.getName())
                || !booking.getUser().getEmail()
                .equalsIgnoreCase(authentication.getName())) {
            throw new AccessDeniedException(
                    "You cannot access this ticket.");
        }

        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new IllegalStateException(
                    "A ticket is available only for confirmed bookings.");
        }

        List<Payment> payments =
                paymentRepository.findByBooking_IdOrderByCreatedAtDesc(
                        booking.getId());

        boolean paymentSuccessful = payments.stream()
                .anyMatch(payment ->
                        payment.getStatus() == PaymentStatus.SUCCESS);

        if (!paymentSuccessful) {
            throw new IllegalStateException(
                    "A ticket requires a successful payment.");
        }

        List<String> seatLabels =
                bookingSeatRepository.findByBooking_Id(booking.getId())
                        .stream()
                        .map(this::toSeatLabel)
                        .toList();

        var show = booking.getMovieShow();
        var screen = show.getScreen();

        Payment latestPayment = payments.stream()
                .filter(payment ->
                        payment.getStatus() == PaymentStatus.SUCCESS)
                .findFirst()
                .orElseThrow();

        return new TicketResponse(
                booking.getId(),
                booking.getBookingReference(),
                booking.getStatus().name(),
                latestPayment.getStatus().name(),
                show.getMovie().getTitle(),
                show.getLanguage(),
                show.getFormat().name(),
                screen.getTheatre().getName(),
                screen.getScreenName(),
                show.getStartTime(),
                booking.getTotalAmount(),
                seatLabels
        );
    }

    private String toSeatLabel(BookingSeat bookingSeat) {
        var seat = bookingSeat.getShowSeat().getSeat();
        return seat.getRowLabel() + seat.getSeatNumber();
    }
}
