package com.rogerjaden.bookmyshow.controller;

import com.rogerjaden.bookmyshow.dto.request.CreateGenreRequest;
import com.rogerjaden.bookmyshow.dto.request.UpdateGenreRequest;
import com.rogerjaden.bookmyshow.dto.response.GenreResponse;
import com.rogerjaden.bookmyshow.service.interfaces.GenreService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@Validated
@RequestMapping("/api/v1/genres")
@PreAuthorize("hasRole('ADMIN')")
public class GenreController {
    private final GenreService genreService;

    public GenreController(GenreService genreService) {
        this.genreService = genreService;
    }

    @PostMapping
    public ResponseEntity<GenreResponse> createGenre(@Valid @RequestBody CreateGenreRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(genreService.createGenre(request));
    }

    @GetMapping
    public ResponseEntity<List<GenreResponse>> getAllGenres() {
        return ResponseEntity.ok(genreService.getAllGenres());
    }

    @GetMapping("/{genreId}")
    public ResponseEntity<GenreResponse> getGenreById(@PathVariable @Positive Long genreId) {
        return ResponseEntity.ok(genreService.getGenreById(genreId));
    }

    @PutMapping("/{genreId}")
    public ResponseEntity<GenreResponse> updateGenre(
            @PathVariable @Positive Long genreId,
            @Valid @RequestBody UpdateGenreRequest request) {
        return ResponseEntity.ok(genreService.updateGenre(genreId, request));
    }

    @DeleteMapping("/{genreId}")
    public ResponseEntity<Void> deleteGenre(@PathVariable @Positive Long genreId) {
        genreService.deleteGenre(genreId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/movies/{movieId}")
    public ResponseEntity<Void> assignGenresToMovie(
            @PathVariable @Positive Long movieId,
            @RequestBody(required = false) GenreAssignmentRequest request) {
        genreService.assignGenresToMovie(movieId, request == null ? List.of() : request.genreIds());
        return ResponseEntity.noContent().build();
    }

    public record GenreAssignmentRequest(@NotNull List<@Positive Long> genreIds) {}
}
