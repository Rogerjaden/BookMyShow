package com.rogerjaden.bookmyshow.service.impl;

import com.rogerjaden.bookmyshow.dto.request.CreateBookingRequest;
import com.rogerjaden.bookmyshow.dto.response.BookingResponse;
import com.rogerjaden.bookmyshow.dto.response.BookingSeatResponse;
import com.rogerjaden.bookmyshow.dto.response.PageResponse;
import com.rogerjaden.bookmyshow.entity.*;
import com.rogerjaden.bookmyshow.entity.enums.BookingStatus;
import com.rogerjaden.bookmyshow.entity.enums.ShowSeatStatus;
import com.rogerjaden.bookmyshow.entity.enums.ShowStatus;
import com.rogerjaden.bookmyshow.exception.ConflictException;
import com.rogerjaden.bookmyshow.exception.ResourceNotFoundException;
import com.rogerjaden.bookmyshow.repository.*;
import com.rogerjaden.bookmyshow.service.interfaces.BookingService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
public class BookingServiceImpl implements BookingService {

    private static final int LOCK_MINUTES = 5;

    private final BookingRepository bookingRepository;
    private final BookingSeatRepository bookingSeatRepository;
    private final ShowSeatRepository showSeatRepository;
    private final MovieShowRepository movieShowRepository;
    private final UserRepository userRepository;

    public BookingServiceImpl(
            BookingRepository bookingRepository,
            BookingSeatRepository bookingSeatRepository,
            ShowSeatRepository showSeatRepository,
            MovieShowRepository movieShowRepository,
            UserRepository userRepository) {
        this.bookingRepository = bookingRepository;
        this.bookingSeatRepository = bookingSeatRepository;
        this.showSeatRepository = showSeatRepository;
        this.movieShowRepository = movieShowRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public BookingResponse createBooking(CreateBookingRequest request) {

        if (request.showSeatIds().size()
                != new HashSet<>(request.showSeatIds()).size()) {
            throw new IllegalArgumentException(
                    "The same seat cannot be requested more than once.");
        }

        User user = getCurrentUser();

        MovieShow show = movieShowRepository
                .findByIdWithDetails(request.movieShowId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Show not found with id: " + request.movieShowId()));

        if (show.getStatus() != ShowStatus.SCHEDULED) {
            throw new ConflictException(
                    "Bookings are available only for scheduled shows.");
        }

        if (!show.getStartTime().isAfter(LocalDateTime.now())) {
            throw new ConflictException("This show has already started.");
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime lockedUntil = now.plusMinutes(LOCK_MINUTES);

        int claimedSeats = showSeatRepository.claimAvailableSeats(
                request.showSeatIds(),
                request.movieShowId(),
                ShowSeatStatus.AVAILABLE,
                ShowSeatStatus.LOCKED,
                now,
                lockedUntil
        );

        if (claimedSeats != request.showSeatIds().size()) {
            throw new ConflictException(
                    "One or more selected seats are no longer available.");
        }

        List<ShowSeat> seats =
                showSeatRepository.findAllById(request.showSeatIds());

        if (seats.size() != request.showSeatIds().size()
                || seats.stream().anyMatch(
                seat -> !seat.getMovieShow().getId()
                        .equals(request.movieShowId()))) {
            throw new ResourceNotFoundException(
                    "One or more selected seats do not belong to this show.");
        }

        BigDecimal total = seats.stream()
                .map(ShowSeat::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Booking booking = new Booking();
        booking.setBookingReference(UUID.randomUUID().toString());
        booking.setUser(user);
        booking.setMovieShow(show);
        booking.setTotalAmount(total);
        booking.setStatus(BookingStatus.PENDING);
        booking.setExpiresAt(lockedUntil);

        booking = bookingRepository.save(booking);

        List<BookingSeat> bookingSeats = new ArrayList<>();

        for (ShowSeat seat : seats) {
            BookingSeat bookingSeat = new BookingSeat();
            bookingSeat.setBooking(booking);
            bookingSeat.setShowSeat(seat);
            bookingSeat.setPriceAtBooking(seat.getPrice());
            bookingSeats.add(bookingSeat);
        }

        bookingSeatRepository.saveAll(bookingSeats);

        return toResponse(booking);
    }

    @Override
    @Transactional(readOnly = true)
    public BookingResponse getBookingById(Long bookingId) {

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Booking not found with id: " + bookingId));

        ensureOwner(booking);

        return toResponse(booking);
    }

    @Override
    @Transactional(readOnly = true)
    public BookingResponse getBookingByReference(String bookingReference) {

        Booking booking = bookingRepository
                .findByBookingReference(bookingReference)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Booking not found: " + bookingReference));

        ensureOwner(booking);

        return toResponse(booking);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<BookingResponse> getMyBookings(int page, int size) {

        if (page < 0 || size < 1 || size > 100) {
            throw new IllegalArgumentException(
                    "Page must be non-negative and size must be between 1 and 100.");
        }

        User user = getCurrentUser();

        Page<Booking> result =
                bookingRepository.findByUser_IdOrderByCreatedAtDesc(
                        user.getId(),
                        PageRequest.of(
                                page,
                                size,
                                Sort.by(Sort.Direction.DESC, "createdAt"))
                );

        return new PageResponse<>(
                result.getContent().stream()
                        .map(this::toResponse)
                        .toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.isLast()
        );
    }

    @Override
    @Transactional
    public BookingResponse cancelBooking(Long bookingId) {

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Booking not found with id: " + bookingId));

        ensureOwner(booking);

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new ConflictException(
                    "Only pending bookings can be cancelled.");
        }

        releaseSeats(booking);

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setExpiresAt(null);

        return toResponse(bookingRepository.save(booking));
    }

    @Override
    @Transactional
    public BookingResponse expireBooking(Long bookingId) {

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Booking not found with id: " + bookingId));

        if (booking.getStatus() != BookingStatus.PENDING
                || booking.getExpiresAt() == null
                || booking.getExpiresAt().isAfter(LocalDateTime.now())) {
            throw new ConflictException(
                    "This booking is not eligible for expiry.");
        }

        releaseSeats(booking);

        booking.setStatus(BookingStatus.EXPIRED);

        return toResponse(bookingRepository.save(booking));
    }

    private void releaseSeats(Booking booking) {

        List<BookingSeat> bookingSeats =
                bookingSeatRepository.findByBooking_Id(booking.getId());

        List<Long> ids = bookingSeats.stream()
                .map(bookingSeat -> bookingSeat.getShowSeat().getId())
                .toList();

        if (ids.isEmpty()) {
            return;
        }

        List<ShowSeat> seats = showSeatRepository.findAllByIdsForUpdate(
                ids, booking.getMovieShow().getId());

        for (ShowSeat seat : seats) {
            if (seat.getStatus() == ShowSeatStatus.LOCKED
                    && booking.getExpiresAt() != null
                    && Objects.equals(
                    seat.getLockedUntil(), booking.getExpiresAt())) {
                seat.setStatus(ShowSeatStatus.AVAILABLE);
                seat.setLockedUntil(null);
            }
        }

        showSeatRepository.saveAll(seats);
    }

    private User getCurrentUser() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getName() == null
                || "anonymousUser".equals(authentication.getName())) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Authentication is required.");
        }

        return userRepository.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Authenticated user was not found."));
    }

    private void ensureOwner(Booking booking) {

        if (!booking.getUser().getId().equals(getCurrentUser().getId())) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "You cannot access another user's booking.");
        }
    }

    private BookingResponse toResponse(Booking booking) {

        List<BookingSeatResponse> seats =
                bookingSeatRepository.findByBooking_Id(booking.getId())
                        .stream()
                        .map(bookingSeat -> {
                            Seat seat = bookingSeat.getShowSeat().getSeat();

                            return new BookingSeatResponse(
                                    bookingSeat.getId(),
                                    bookingSeat.getShowSeat().getId(),
                                    seat.getRowLabel(),
                                    seat.getSeatNumber(),
                                    bookingSeat.getPriceAtBooking()
                            );
                        })
                        .toList();

        MovieShow show = booking.getMovieShow();

        return new BookingResponse(
                booking.getId(),
                booking.getBookingReference(),
                booking.getUser().getId(),
                show.getId(),
                show.getMovie().getTitle(),
                show.getScreen().getTheatre().getName(),
                show.getStartTime(),
                booking.getTotalAmount(),
                booking.getStatus(),
                booking.getExpiresAt(),
                booking.getConfirmedAt(),
                seats,
                booking.getCreatedAt(),
                booking.getUpdatedAt()
        );
    }
}