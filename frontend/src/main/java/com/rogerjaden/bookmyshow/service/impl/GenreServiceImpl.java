package com.rogerjaden.bookmyshow.service.impl;

import com.rogerjaden.bookmyshow.dto.request.CreateGenreRequest;
import com.rogerjaden.bookmyshow.dto.request.UpdateGenreRequest;
import com.rogerjaden.bookmyshow.dto.response.GenreResponse;
import com.rogerjaden.bookmyshow.entity.Genre;
import com.rogerjaden.bookmyshow.entity.Movie;
import com.rogerjaden.bookmyshow.exception.ConflictException;
import com.rogerjaden.bookmyshow.exception.ResourceNotFoundException;
import com.rogerjaden.bookmyshow.repository.GenreRepository;
import com.rogerjaden.bookmyshow.repository.MovieRepository;
import com.rogerjaden.bookmyshow.service.interfaces.GenreService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@Transactional
public class GenreServiceImpl implements GenreService {
    private final GenreRepository genreRepository;
    private final MovieRepository movieRepository;

    public GenreServiceImpl(GenreRepository genreRepository, MovieRepository movieRepository) {
        this.genreRepository = genreRepository;
        this.movieRepository = movieRepository;
    }

    @Override
    public GenreResponse createGenre(CreateGenreRequest request) {
        String name = request.name().trim();
        if (genreRepository.existsByNameIgnoreCase(name)) {
            throw new ConflictException("A genre with this name already exists.");
        }

        Genre genre = new Genre();
        genre.setName(name);
        genre.setDescription(trimToNull(request.description()));
        return toResponse(genreRepository.save(genre));
    }

    @Override
    public GenreResponse updateGenre(Long genreId, UpdateGenreRequest request) {
        Genre genre = findGenre(genreId);
        String name = request.name().trim();

        genreRepository.findByNameIgnoreCase(name)
            .filter(existing -> !existing.getId().equals(genreId))
            .ifPresent(existing -> { throw new ConflictException("A genre with this name already exists."); });

        genre.setName(name);
        genre.setDescription(trimToNull(request.description()));
        return toResponse(genreRepository.save(genre));
    }

    @Override
    @Transactional(readOnly = true)
    public GenreResponse getGenreById(Long genreId) {
        return toResponse(findGenre(genreId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<GenreResponse> getAllGenres() {
        return genreRepository.findAll(SortByName.ascending())
            .stream().map(this::toResponse).toList();
    }

    @Override
    public void deleteGenre(Long genreId) {
        Genre genre = findGenre(genreId);
        if (movieRepository.existsByGenres_Id(genreId)) {
            throw new ConflictException("Cannot delete a genre assigned to one or more movies. Remove its movie assignments first.");
        }
        genreRepository.delete(genre);
    }

    @Override
    public void assignGenresToMovie(Long movieId, List<Long> genreIds) {
        if (movieId == null || movieId <= 0) {
            throw new IllegalArgumentException("movieId must be a positive number.");
        }
        Movie movie = movieRepository.findById(movieId)
            .orElseThrow(() -> new ResourceNotFoundException("Movie not found with id: " + movieId));

        List<Long> ids = genreIds == null ? List.of() : genreIds;
        if (ids.stream().anyMatch(id -> id == null || id <= 0)) {
            throw new IllegalArgumentException("Every genre ID must be a positive number.");
        }

        Set<Long> uniqueIds = new LinkedHashSet<>(ids);
        List<Genre> genres = genreRepository.findAllById(uniqueIds);
        if (genres.size() != uniqueIds.size()) {
            Set<Long> foundIds = new LinkedHashSet<>();
            genres.forEach(g -> foundIds.add(g.getId()));
            Set<Long> missing = new LinkedHashSet<>(uniqueIds);
            missing.removeAll(foundIds);
            throw new ResourceNotFoundException("Genre(s) not found: " + missing);
        }

        // This replaces the complete assignment; an empty list removes all genres.
        movie.setGenres(new LinkedHashSet<>(genres));
        movieRepository.save(movie);
    }

    private Genre findGenre(Long id) {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("genreId must be a positive number.");
        }
        return genreRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Genre not found with id: " + id));
    }

    private GenreResponse toResponse(Genre genre) {
        return new GenreResponse(genre.getId(), genre.getName(), genre.getDescription());
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static final org.springframework.data.domain.Sort SortByName =
        org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.ASC, "name");
}
