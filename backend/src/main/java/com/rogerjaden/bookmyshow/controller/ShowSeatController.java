package com.rogerjaden.bookmyshow.controller;

import com.rogerjaden.bookmyshow.dto.request.CreateShowSeatRequest;
import com.rogerjaden.bookmyshow.dto.response.ShowSeatResponse;
import com.rogerjaden.bookmyshow.service.interfaces.ShowSeatService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/shows/{showId}/seats")
@Validated
public class ShowSeatController {
    private final ShowSeatService showSeatService;

    public ShowSeatController(ShowSeatService showSeatService) {
        this.showSeatService = showSeatService;
    }

    @PostMapping("/generate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ShowSeatResponse>> generateInventory(
            @PathVariable Long showId,
            @RequestParam @DecimalMin(value = "0.00", inclusive = true) BigDecimal defaultPrice) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(showSeatService.generateInventoryForShow(showId, defaultPrice));
    }

    @GetMapping
    public ResponseEntity<List<ShowSeatResponse>> getSeats(@PathVariable Long showId) {
        return ResponseEntity.ok(showSeatService.getSeatsForShow(showId));
    }

    @GetMapping("/available")
    public ResponseEntity<List<ShowSeatResponse>> getAvailableSeats(@PathVariable Long showId) {
        return ResponseEntity.ok(showSeatService.getAvailableSeats(showId));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ShowSeatResponse> createShowSeat(
            @PathVariable Long showId, @Valid @RequestBody CreateShowSeatRequest request) {
        if (!showId.equals(request.movieShowId())) {
            throw new IllegalArgumentException("Path showId must match request movieShowId.");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(showSeatService.createShowSeat(request));
    }

    @PatchMapping("/inventory/{showSeatId}/price")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ShowSeatResponse> updateSeatPrice(
            @PathVariable Long showId, @PathVariable Long showSeatId,
            @RequestParam @DecimalMin(value = "0.00", inclusive = true) BigDecimal price) {
        return ResponseEntity.ok(showSeatService.updateSeatPrice(showId, showSeatId, price));
    }
}
