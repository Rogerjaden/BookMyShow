package com.rogerjaden.bookmyshow.service.impl;

import com.rogerjaden.bookmyshow.dto.request.CreateShowSeatRequest;
import com.rogerjaden.bookmyshow.dto.response.ShowSeatResponse;
import com.rogerjaden.bookmyshow.entity.MovieShow;
import com.rogerjaden.bookmyshow.entity.Seat;
import com.rogerjaden.bookmyshow.entity.ShowSeat;
import com.rogerjaden.bookmyshow.entity.enums.SeatStatus;
import com.rogerjaden.bookmyshow.entity.enums.ShowSeatStatus;
import com.rogerjaden.bookmyshow.entity.enums.ShowStatus;
import com.rogerjaden.bookmyshow.exception.ConflictException;
import com.rogerjaden.bookmyshow.exception.ResourceNotFoundException;
import com.rogerjaden.bookmyshow.repository.MovieShowRepository;
import com.rogerjaden.bookmyshow.repository.SeatRepository;
import com.rogerjaden.bookmyshow.repository.ShowSeatRepository;
import com.rogerjaden.bookmyshow.service.interfaces.ShowSeatService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class ShowSeatServiceImpl implements ShowSeatService {
    private final ShowSeatRepository showSeatRepository;
    private final MovieShowRepository showRepository;
    private final SeatRepository seatRepository;

    public ShowSeatServiceImpl(ShowSeatRepository showSeatRepository, MovieShowRepository showRepository,
                               SeatRepository seatRepository) {
        this.showSeatRepository = showSeatRepository;
        this.showRepository = showRepository;
        this.seatRepository = seatRepository;
    }

    @Override
    public List<ShowSeatResponse> generateInventoryForShow(Long movieShowId) {
        return generateInventoryForShow(movieShowId, BigDecimal.ZERO);
    }

    @Override
    public List<ShowSeatResponse> generateInventoryForShow(Long movieShowId, BigDecimal defaultPrice) {
        validatePrice(defaultPrice);
        MovieShow show = findShow(movieShowId);
        if (show.getStatus() != ShowStatus.SCHEDULED) throw new ConflictException("Inventory can only be generated for a scheduled show.");
        List<Seat> seats = seatRepository.findByScreen_IdAndStatus(show.getScreen().getId(), SeatStatus.ACTIVE);
        for (Seat seat : seats) {
            if (!showSeatRepository.existsByMovieShow_IdAndSeat_Id(movieShowId, seat.getId())) {
                ShowSeat inventory = new ShowSeat();
                inventory.setMovieShow(show);
                inventory.setSeat(seat);
                inventory.setPrice(defaultPrice);
                inventory.setStatus(ShowSeatStatus.AVAILABLE);
                showSeatRepository.save(inventory);
            }
        }
        return getSeatsForShow(movieShowId);
    }

    @Override
    public ShowSeatResponse createShowSeat(CreateShowSeatRequest request) {
        validatePrice(request.price());
        MovieShow show = findShow(request.movieShowId());
        if (show.getStatus() != ShowStatus.SCHEDULED) throw new ConflictException("Seats can only be added to a scheduled show.");
        Seat seat = seatRepository.findById(request.seatId())
                .orElseThrow(() -> new ResourceNotFoundException("Seat not found with id: " + request.seatId()));
        if (!seat.getScreen().getId().equals(show.getScreen().getId())) {
            throw new IllegalArgumentException("Seat does not belong to the screen assigned to this show.");
        }
        if (seat.getStatus() != SeatStatus.ACTIVE) throw new ConflictException("Inactive or maintenance seats cannot be added to show inventory.");
        if (showSeatRepository.existsByMovieShow_IdAndSeat_Id(show.getId(), seat.getId())) {
            throw new ConflictException("Inventory already exists for this seat and show.");
        }
        if (request.status() == ShowSeatStatus.BOOKED || request.status() == ShowSeatStatus.LOCKED) {
            throw new IllegalArgumentException("New inventory must be AVAILABLE or BLOCKED; booking/locking belongs to the booking flow.");
        }
        ShowSeat showSeat = new ShowSeat();
        showSeat.setMovieShow(show);
        showSeat.setSeat(seat);
        showSeat.setPrice(request.price());
        showSeat.setStatus(request.status());
        return toResponse(showSeatRepository.save(showSeat));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ShowSeatResponse> getSeatsForShow(Long movieShowId) {
        findShow(movieShowId);
        return showSeatRepository.findByMovieShow_IdOrderBySeat_RowLabelAscSeat_SeatNumberAsc(movieShowId)
                .stream().map(this::toResponse).toList();
    }

    @Override
    public List<ShowSeatResponse> getAvailableSeats(Long movieShowId) {
        MovieShow show = findShow(movieShowId);
        if (show.getStatus() != ShowStatus.SCHEDULED) return List.of();
        LocalDateTime now = LocalDateTime.now();
        List<ShowSeat> expiredLocks = showSeatRepository.findByMovieShow_IdAndStatusAndLockedUntilBefore(
                movieShowId, ShowSeatStatus.LOCKED, now);
        expiredLocks.forEach(seat -> { seat.setStatus(ShowSeatStatus.AVAILABLE); seat.setLockedUntil(null); });
        if (!expiredLocks.isEmpty()) showSeatRepository.saveAll(expiredLocks);
        return showSeatRepository.findByMovieShow_IdAndStatusOrderBySeat_RowLabelAscSeat_SeatNumberAsc(
                movieShowId, ShowSeatStatus.AVAILABLE).stream().map(this::toResponse).toList();
    }

    @Override
    public ShowSeatResponse updateSeatPrice(Long showSeatId, BigDecimal newPrice) {
        validatePrice(newPrice);
        ShowSeat showSeat = showSeatRepository.findByIdForUpdate(showSeatId)
                .orElseThrow(() -> new ResourceNotFoundException("Show seat not found with id: " + showSeatId));
        return changePrice(showSeat, newPrice);
    }

    @Override
    public ShowSeatResponse updateSeatPrice(Long movieShowId, Long showSeatId, BigDecimal newPrice) {
        validatePrice(newPrice);
        ShowSeat showSeat = showSeatRepository.findByIdForUpdate(showSeatId)
                .orElseThrow(() -> new ResourceNotFoundException("Show seat not found with id: " + showSeatId));
        if (!showSeat.getMovieShow().getId().equals(movieShowId)) {
            throw new IllegalArgumentException("Seat inventory does not belong to this show.");
        }
        return changePrice(showSeat, newPrice);
    }

    private ShowSeatResponse changePrice(ShowSeat showSeat, BigDecimal newPrice) {
        if (showSeat.getStatus() == ShowSeatStatus.BOOKED || showSeat.getStatus() == ShowSeatStatus.LOCKED) {
            throw new ConflictException("Cannot change the price of a booked or locked seat.");
        }
        if (showSeat.getMovieShow().getStatus() != ShowStatus.SCHEDULED) {
            throw new ConflictException("Prices can only be changed for a scheduled show.");
        }
        showSeat.setPrice(newPrice);
        return toResponse(showSeatRepository.save(showSeat));
    }

    private MovieShow findShow(Long id) {
        if (id == null || id <= 0) throw new IllegalArgumentException("movieShowId must be positive.");
        return showRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Show not found with id: " + id));
    }
    private void validatePrice(BigDecimal price) {
        if (price == null || price.compareTo(BigDecimal.ZERO) < 0) throw new IllegalArgumentException("Price must be zero or greater.");
    }
    private ShowSeatResponse toResponse(ShowSeat ss) {
        Seat seat = ss.getSeat();
        return new ShowSeatResponse(ss.getId(), ss.getMovieShow().getId(), seat.getId(), seat.getRowLabel(),
                seat.getSeatNumber(), seat.getSeatType(), ss.getPrice(), ss.getStatus(), ss.getLockedUntil());
    }
}
