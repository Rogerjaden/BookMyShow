package com.rogerjaden.bookmyshow.controller;

import com.rogerjaden.bookmyshow.dto.request.CreateMovieRequest;
import com.rogerjaden.bookmyshow.dto.request.UpdateMovieRequest;
import com.rogerjaden.bookmyshow.dto.response.MovieResponse;
import com.rogerjaden.bookmyshow.service.interfaces.MovieService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/movies")
public class MovieController {
    private final MovieService movieService;

    public MovieController(MovieService movieService) {
        this.movieService = movieService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MovieResponse> createMovie(@Valid @RequestBody CreateMovieRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(movieService.createMovie(request));
    }

    @GetMapping
    public ResponseEntity<?> getMovies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        return ResponseEntity.ok(movieService.getMovies(page, size, sortBy, direction));
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchMovies(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String language,
            @RequestParam(required = false) Long genreId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        return ResponseEntity.ok(movieService.searchMovies(
            query, language, genreId, page, size, sortBy, direction));
    }

    @GetMapping("/{movieId}")
    public ResponseEntity<MovieResponse> getMovieById(@PathVariable Long movieId) {
        return ResponseEntity.ok(movieService.getMovieById(movieId));
    }

    @PatchMapping("/{movieId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MovieResponse> updateMovie(
            @PathVariable Long movieId, @Valid @RequestBody UpdateMovieRequest request) {
        return ResponseEntity.ok(movieService.updateMovie(movieId, request));
    }

    @PatchMapping("/{movieId}/publish")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MovieResponse> publishMovie(@PathVariable Long movieId) {
        return ResponseEntity.ok(movieService.publishMovie(movieId));
    }

    @DeleteMapping("/{movieId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteMovie(@PathVariable Long movieId) {
        movieService.deleteMovie(movieId);
        return ResponseEntity.noContent().build();
    }
}
