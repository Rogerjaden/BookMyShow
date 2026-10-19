package com.rogerjaden.bookmyshow.controller;

import com.rogerjaden.bookmyshow.dto.request.CreateScreenRequest;
import com.rogerjaden.bookmyshow.dto.response.ScreenResponse;
import com.rogerjaden.bookmyshow.service.interfaces.ScreenService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/screens")
@PreAuthorize("hasRole('ADMIN')")
public class ScreenController {
    private final ScreenService screenService;

    public ScreenController(ScreenService screenService) {
        this.screenService = screenService;
    }

    @PostMapping
    public ResponseEntity<ScreenResponse> create(@Valid @RequestBody CreateScreenRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(screenService.createScreen(request));
    }

    @GetMapping("/{screenId}")
    public ResponseEntity<ScreenResponse> getById(@PathVariable Long screenId) {
        return ResponseEntity.ok(screenService.getScreenById(screenId));
    }

    @GetMapping("/by-theatre/{theatreId}")
    public ResponseEntity<List<ScreenResponse>> getByTheatre(@PathVariable Long theatreId) {
        return ResponseEntity.ok(screenService.getScreensByTheatre(theatreId));
    }

    @PutMapping("/{screenId}")
    public ResponseEntity<ScreenResponse> update(@PathVariable Long screenId,
            @Valid @RequestBody CreateScreenRequest request) {
        return ResponseEntity.ok(screenService.updateScreen(screenId, request));
    }

    @DeleteMapping("/{screenId}")
    public ResponseEntity<Void> deactivate(@PathVariable Long screenId) {
        screenService.deactivateScreen(screenId);
        return ResponseEntity.noContent().build();
    }
}
