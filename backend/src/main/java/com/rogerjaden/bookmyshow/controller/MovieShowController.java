package com.rogerjaden.bookmyshow.controller;

import com.rogerjaden.bookmyshow.dto.request.CreateMovieShowRequest;
import com.rogerjaden.bookmyshow.dto.request.UpdateMovieShowRequest;
import com.rogerjaden.bookmyshow.dto.response.MovieShowResponse;
import com.rogerjaden.bookmyshow.dto.response.PageResponse;
import com.rogerjaden.bookmyshow.service.interfaces.MovieShowService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/shows")
public class MovieShowController {
    private final MovieShowService movieShowService;

    public MovieShowController(MovieShowService movieShowService) {
        this.movieShowService = movieShowService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MovieShowResponse> createShow(@Valid @RequestBody CreateMovieShowRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(movieShowService.createShow(request));
    }

    @PatchMapping("/{showId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MovieShowResponse> updateShow(
            @PathVariable Long showId, @Valid @RequestBody UpdateMovieShowRequest request) {
        return ResponseEntity.ok(movieShowService.updateShow(showId, request));
    }

    @GetMapping("/{showId}")
    public ResponseEntity<MovieShowResponse> getShowById(@PathVariable Long showId) {
        return ResponseEntity.ok(movieShowService.getShowById(showId));
    }

    @GetMapping
    public ResponseEntity<PageResponse<MovieShowResponse>> findShows(
            @RequestParam(required = false) Long movieId,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String language,
            @RequestParam(required = false) String format,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "startTime") String sortBy,
            @RequestParam(defaultValue = "asc") String direction) {
        return ResponseEntity.ok(movieShowService.findShows(
                movieId, city, date, language, format, page, size, sortBy, direction));
    }

    @DeleteMapping("/{showId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> cancelShow(@PathVariable Long showId) {
        movieShowService.cancelShow(showId);
        return ResponseEntity.noContent().build();
    }
}
