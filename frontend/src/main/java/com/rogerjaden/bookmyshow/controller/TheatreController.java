package com.rogerjaden.bookmyshow.controller;

import com.rogerjaden.bookmyshow.dto.request.CreateTheatreRequest;
import com.rogerjaden.bookmyshow.dto.request.UpdateTheatreRequest;
import com.rogerjaden.bookmyshow.dto.response.TheatreResponse;
import com.rogerjaden.bookmyshow.service.interfaces.TheatreService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/theatres")
@PreAuthorize("hasRole('ADMIN')")
public class TheatreController {
    private final TheatreService theatreService;

    public TheatreController(TheatreService theatreService) {
        this.theatreService = theatreService;
    }

    @PostMapping
    public ResponseEntity<TheatreResponse> create(@Valid @RequestBody CreateTheatreRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(theatreService.createTheatre(request));
    }

    @GetMapping
    public ResponseEntity<?> getAll(@RequestParam(required = false) String city,
                                    @RequestParam(defaultValue = "0") int page,
                                    @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(theatreService.getTheatres(city, page, size));
    }

    @GetMapping("/{theatreId}")
    public ResponseEntity<TheatreResponse> getById(@PathVariable Long theatreId) {
        return ResponseEntity.ok(theatreService.getTheatreById(theatreId));
    }

    @PutMapping("/{theatreId}")
    public ResponseEntity<TheatreResponse> update(@PathVariable Long theatreId,
            @Valid @RequestBody UpdateTheatreRequest request) {
        return ResponseEntity.ok(theatreService.updateTheatre(theatreId, request));
    }

    @DeleteMapping("/{theatreId}")
    public ResponseEntity<Void> deactivate(@PathVariable Long theatreId) {
        theatreService.deactivateTheatre(theatreId);
        return ResponseEntity.noContent().build();
    }
}
