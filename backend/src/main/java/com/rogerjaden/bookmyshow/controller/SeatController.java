package com.rogerjaden.bookmyshow.controller;

import com.rogerjaden.bookmyshow.dto.request.CreateSeatRequest;
import com.rogerjaden.bookmyshow.dto.response.SeatResponse;
import com.rogerjaden.bookmyshow.service.interfaces.SeatService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/screens/{screenId}/seats")
@PreAuthorize("hasRole('ADMIN')")
public class SeatController {
    private final SeatService seatService;

    public SeatController(SeatService seatService) {
        this.seatService = seatService;
    }

    @PostMapping
    public ResponseEntity<SeatResponse> create(@PathVariable Long screenId,
            @Valid @RequestBody CreateSeatRequest request) {
        if (request.screenId() != null && !request.screenId().equals(screenId)) {
            throw new IllegalArgumentException("screenId in request must match the URL.");
        }
        CreateSeatRequest normalized = new CreateSeatRequest(screenId, request.rowLabel(),
                request.seatNumber(), request.seatType(), request.status());
        return ResponseEntity.status(HttpStatus.CREATED).body(seatService.createSeat(normalized));
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<SeatResponse>> createBulk(@PathVariable Long screenId,
            @Valid @RequestBody List<@Valid CreateSeatRequest> requests) {
        return ResponseEntity.status(HttpStatus.CREATED).body(seatService.createSeats(screenId, requests));
    }

    @GetMapping
    public ResponseEntity<List<SeatResponse>> getAll(@PathVariable Long screenId) {
        return ResponseEntity.ok(seatService.getSeatsByScreen(screenId));
    }

    @GetMapping("/{seatId}")
    public ResponseEntity<SeatResponse> getById(@PathVariable Long screenId, @PathVariable Long seatId) {
        return ResponseEntity.ok(seatService.getSeatById(screenId, seatId));
    }

    @PutMapping("/{seatId}")
    public ResponseEntity<SeatResponse> update(@PathVariable Long screenId, @PathVariable Long seatId,
            @Valid @RequestBody CreateSeatRequest request) {
        return ResponseEntity.ok(seatService.updateSeat(screenId, seatId, request));
    }

    @DeleteMapping("/{seatId}")
    public ResponseEntity<Void> deactivate(@PathVariable Long screenId, @PathVariable Long seatId) {
        seatService.deactivateSeat(screenId, seatId);
        return ResponseEntity.noContent().build();
    }
}
