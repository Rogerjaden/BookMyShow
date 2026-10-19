package com.rogerjaden.bookmyshow.service.impl;

import com.rogerjaden.bookmyshow.dto.request.CreateSeatRequest;
import com.rogerjaden.bookmyshow.dto.response.SeatResponse;
import com.rogerjaden.bookmyshow.entity.Screen;
import com.rogerjaden.bookmyshow.entity.Seat;
import com.rogerjaden.bookmyshow.entity.enums.ScreenStatus;
import com.rogerjaden.bookmyshow.entity.enums.TheatreStatus;
import com.rogerjaden.bookmyshow.entity.enums.SeatStatus;
import com.rogerjaden.bookmyshow.exception.ConflictException;
import com.rogerjaden.bookmyshow.exception.ResourceNotFoundException;
import com.rogerjaden.bookmyshow.repository.ScreenRepository;
import com.rogerjaden.bookmyshow.repository.SeatRepository;
import com.rogerjaden.bookmyshow.service.interfaces.SeatService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Transactional
public class SeatServiceImpl implements SeatService {
    private final SeatRepository seatRepository;
    private final ScreenRepository screenRepository;

    public SeatServiceImpl(SeatRepository seatRepository, ScreenRepository screenRepository) {
        this.seatRepository = seatRepository;
        this.screenRepository = screenRepository;
    }

    @Override
    public SeatResponse createSeat(CreateSeatRequest request) {
        Screen screen = findScreen(request.screenId());
        ensureScreenActive(screen);
        String row = normalizeRow(request.rowLabel());
        ensureUniqueSeat(screen.getId(), row, request.seatNumber(), null);

        Seat seat = new Seat();
        seat.setScreen(screen);
        seat.setRowLabel(row);
        seat.setSeatNumber(request.seatNumber());
        seat.setSeatType(request.seatType());
        seat.setStatus(request.status());
        return saveSeat(seat);
    }

    @Override
    public List<SeatResponse> createSeats(Long screenId, List<CreateSeatRequest> requests) {
        Screen screen = findScreen(screenId);
        ensureScreenActive(screen);
        if (requests == null || requests.isEmpty())
            throw new IllegalArgumentException("At least one seat is required.");

        Set<String> positions = new HashSet<>();
        for (CreateSeatRequest r : requests) {
            if (r == null) throw new IllegalArgumentException("Seat request cannot be null.");
            if (r.seatNumber() == null || r.seatNumber() <= 0)
                throw new IllegalArgumentException("Every seat number must be positive.");
            String row = normalizeRow(r.rowLabel());
            String key = row.toUpperCase(Locale.ROOT) + "#" + r.seatNumber();
            if (!positions.add(key) || seatRepository.existsByScreen_IdAndRowLabelIgnoreCaseAndSeatNumber(
                    screenId, row, r.seatNumber())) {
                throw new ConflictException("Duplicate seat position: " + key);
            }
            if (r.screenId() != null && !r.screenId().equals(screenId))
                throw new IllegalArgumentException("All seats must belong to the screen in the URL.");
        }

        List<Seat> seats = requests.stream().map(r -> {
            Seat s = new Seat();
            s.setScreen(screen);
            s.setRowLabel(normalizeRow(r.rowLabel()));
            s.setSeatNumber(r.seatNumber());
            s.setSeatType(r.seatType());
            s.setStatus(r.status());
            return s;
        }).toList();

        try {
            return seatRepository.saveAll(seats).stream().map(this::toResponse).toList();
        } catch (DataIntegrityViolationException ex) {
            throw new ConflictException("One or more seat positions already exist.");
        }
    }

    @Override
    public SeatResponse updateSeat(Long screenId, Long seatId, CreateSeatRequest request) {
        Seat seat = findSeatForScreen(screenId, seatId);
        if (request.screenId() != null && !request.screenId().equals(screenId))
            throw new IllegalArgumentException("screenId in request must match the URL.");
        String row = normalizeRow(request.rowLabel());
        ensureUniqueSeat(screenId, row, request.seatNumber(), seatId);
        seat.setRowLabel(row);
        seat.setSeatNumber(request.seatNumber());
        seat.setSeatType(request.seatType());
        seat.setStatus(request.status());
        return saveSeat(seat);
    }

    @Override
    @Transactional(readOnly = true)
    public SeatResponse getSeatById(Long screenId, Long seatId) {
        return toResponse(findSeatForScreen(screenId, seatId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<SeatResponse> getSeatsByScreen(Long screenId) {
        findScreen(screenId);
        return seatRepository.findByScreen_Id(screenId).stream().map(this::toResponse).toList();
    }

    @Override
    public void deactivateSeat(Long screenId, Long seatId) {
        Seat seat = findSeatForScreen(screenId, seatId);
        seat.setStatus(SeatStatus.INACTIVE);
        seatRepository.save(seat);
    }

    private SeatResponse saveSeat(Seat seat) {
        try {
            return toResponse(seatRepository.save(seat));
        } catch (DataIntegrityViolationException ex) {
            throw new ConflictException("A seat with this row and number already exists in the screen.");
        }
    }

    private void ensureUniqueSeat(Long screenId, String row, Integer number, Long excludeSeatId) {
        if (number == null || number <= 0) throw new IllegalArgumentException("seatNumber must be positive.");
        boolean exists = seatRepository.existsByScreen_IdAndRowLabelIgnoreCaseAndSeatNumber(screenId, row, number);
        if (exists) {
            boolean sameSeat = excludeSeatId != null && seatRepository.findByScreen_Id(screenId).stream()
                    .anyMatch(s -> s.getId().equals(excludeSeatId)
                            && s.getRowLabel().equalsIgnoreCase(row)
                            && s.getSeatNumber().equals(number));
            if (!sameSeat) throw new ConflictException("A seat with this row and number already exists.");
        }
    }

    private Seat findSeatForScreen(Long screenId, Long seatId) {
        Screen screen = findScreen(screenId);
        if (seatId == null || seatId <= 0) throw new IllegalArgumentException("seatId must be positive.");
        Seat seat = seatRepository.findById(seatId)
                .orElseThrow(() -> new ResourceNotFoundException("Seat not found: " + seatId));
        if (!seat.getScreen().getId().equals(screen.getId()))
            throw new ResourceNotFoundException("Seat not found in screen " + screenId + ": " + seatId);
        return seat;
    }

    private Screen findScreen(Long id) {
        if (id == null || id <= 0) throw new IllegalArgumentException("screenId must be positive.");
        return screenRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Screen not found: " + id));
    }

    private void ensureScreenActive(Screen screen) {
        if (screen.getStatus() != ScreenStatus.ACTIVE
                || screen.getTheatre().getStatus() != TheatreStatus.ACTIVE) {
            throw new IllegalStateException("Cannot create seats for an inactive screen or theatre.");
        }
    }

    private String normalizeRow(String row) {
        if (row == null || row.isBlank()) throw new IllegalArgumentException("rowLabel is required.");
        return row.trim().toUpperCase(Locale.ROOT);
    }

    private SeatResponse toResponse(Seat s) {
        return new SeatResponse(s.getId(), s.getScreen().getId(), s.getRowLabel(),
                s.getSeatNumber(), s.getSeatType(), s.getStatus());
    }
}
