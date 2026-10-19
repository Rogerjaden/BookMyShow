package com.rogerjaden.bookmyshow.service.impl;

import com.rogerjaden.bookmyshow.dto.request.CreateMovieRequest;
import com.rogerjaden.bookmyshow.dto.request.UpdateMovieRequest;
import com.rogerjaden.bookmyshow.dto.response.GenreSummaryResponse;
import com.rogerjaden.bookmyshow.dto.response.MovieResponse;
import com.rogerjaden.bookmyshow.dto.response.PageResponse;
import com.rogerjaden.bookmyshow.entity.Genre;
import com.rogerjaden.bookmyshow.entity.Movie;
import com.rogerjaden.bookmyshow.entity.enums.MovieStatus;
import com.rogerjaden.bookmyshow.entity.enums.NotificationType;
import com.rogerjaden.bookmyshow.exception.ConflictException;
import com.rogerjaden.bookmyshow.exception.ResourceNotFoundException;
import com.rogerjaden.bookmyshow.repository.GenreRepository;
import com.rogerjaden.bookmyshow.repository.MovieRepository;
import com.rogerjaden.bookmyshow.service.interfaces.MovieService;
import com.rogerjaden.bookmyshow.service.interfaces.NotificationService;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.*;

@Service
@Transactional
public class MovieServiceImpl implements MovieService {
    private static final Set<String> SORT_FIELDS =
        Set.of("id", "title", "releaseDate", "durationMinutes", "createdAt", "updatedAt", "language");

    private final GenreRepository genreRepository;
    private final MovieRepository movieRepository;
    private final NotificationService notificationService;

    public MovieServiceImpl(
            MovieRepository movieRepository,
            GenreRepository genreRepository,
            NotificationService notificationService) {
        this.movieRepository = movieRepository;
        this.genreRepository = genreRepository;
        this.notificationService = notificationService;
    }

    @Override
    public MovieResponse createMovie(CreateMovieRequest request) {
        String title = request.title().trim();
        Set<Genre> genres = new LinkedHashSet<>(
                genreRepository.findAllById(request.genreIds())
        );
        if (genres.size() != new HashSet<>(request.genreIds()).size()) {
            throw new ResourceNotFoundException(
                    "One or more genres were not found"
            );
        }
        if (movieRepository.existsByTitleIgnoreCase(title)) {
            throw new ConflictException("A movie with this title already exists.");
        }

        Movie movie = new Movie();
        movie.setTitle(title);
        movie.setDescription(request.description());
        movie.setDurationMinutes(request.durationMinutes());
        movie.setReleaseDate(request.releaseDate());
        movie.setLanguage(request.language().trim());
        movie.setCertificate(trimToNull(request.certificate()));
        movie.setPosterUrl(trimToNull(request.posterUrl()));
        movie.setTrailerUrl(trimToNull(request.trailerUrl()));
        movie.setStatus(request.status());
        movie.setGenres(genres);

        notificationService.broadcastToAllUsers(
                "New Movie Added: " + movie.getTitle(),
                movie.getTitle()
                        + " has been added to BookMyShow! Check out the movie details.",
                NotificationType.PROMOTION
        );

        return toResponse(movieRepository.save(movie));
    }

    @Override
    public MovieResponse updateMovie(
            Long movieId,
            UpdateMovieRequest request
    ) {
        Movie movie = findMovie(movieId);

        if (request.title() != null) {
            String title = request.title().trim();

            if (title.isBlank()) {
                throw new IllegalArgumentException(
                        "Title cannot be blank"
                );
            }
            movie.setTitle(title);
        }

        if (request.description() != null) {
            movie.setDescription(request.description());
        }

        if (request.durationMinutes() != null) {
            movie.setDurationMinutes(request.durationMinutes());
        }

        if (request.releaseDate() != null) {
            movie.setReleaseDate(request.releaseDate());
        }

        if (request.language() != null) {
            if (request.language().isBlank()) {
                throw new IllegalArgumentException(
                        "Language cannot be blank"
                );
            }

            movie.setLanguage(request.language().trim());
        }

        if (request.certificate() != null) {
            movie.setCertificate(trimToNull(request.certificate()));
        }

        if (request.posterUrl() != null) {
            movie.setPosterUrl(trimToNull(request.posterUrl()));
        }

        if (request.trailerUrl() != null) {
            movie.setTrailerUrl(trimToNull(request.trailerUrl()));
        }

        if (request.status() != null) {
            movie.setStatus(request.status());
        }

        if (request.genreIds() != null) {
            Set<Genre> genres = new LinkedHashSet<>(
                    genreRepository.findAllById(request.genreIds())
            );

            if (genres.size() != new HashSet<>(request.genreIds()).size()) {
                throw new ResourceNotFoundException(
                        "One or more genres were not found"
                );
            }

            movie.setGenres(genres);
        }

        return toResponse(movieRepository.save(movie));
    }

    @Override
    @Transactional(readOnly = true)
    public MovieResponse getMovieById(Long movieId) {
        return toResponse(findMovie(movieId));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<MovieResponse> getMovies(int page, int size, String sortBy, String direction) {
        Pageable pageable = pageable(page, size, sortBy, direction);
        Page<Movie> result = movieRepository.searchMovies(
            null, null, null, MovieStatus.INACTIVE, pageable);
        return toPageResponse(result);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<MovieResponse> searchMovies(
            String query, String language, Long genreId,
            int page, int size, String sortBy, String direction) {
        Pageable pageable = pageable(page, size, sortBy, direction);
        String normalizedQuery = StringUtils.hasText(query) ? query.trim() : null;
        String normalizedLanguage = StringUtils.hasText(language) ? language.trim() : null;

        if (genreId != null && genreId <= 0) {
            throw new IllegalArgumentException("genreId must be a positive number.");
        }

        Page<Movie> result = movieRepository.searchMovies(
            normalizedQuery, normalizedLanguage, genreId, MovieStatus.INACTIVE, pageable);
        return toPageResponse(result);
    }

    @Override
    public MovieResponse publishMovie(Long movieId) {
        Movie movie = findMovie(movieId);

        if (!StringUtils.hasText(movie.getTitle())
                || movie.getDurationMinutes() == null
                || movie.getDurationMinutes() <= 0
                || !StringUtils.hasText(movie.getLanguage())) {
            throw new IllegalStateException(
                    "Movie needs a title, positive duration and language before publishing.");
        }

        if (movie.getStatus() == MovieStatus.INACTIVE) {
            throw new IllegalStateException(
                    "An inactive movie cannot be published. Update its status first.");
        }

        boolean newlyPublished =
                movie.getStatus() != MovieStatus.NOW_SHOWING;

        movie.setStatus(MovieStatus.NOW_SHOWING);
        Movie savedMovie = movieRepository.save(movie);

        if (newlyPublished) {
            notificationService.broadcastToAllUsers(
                    "New Movie Released: " + savedMovie.getTitle(),
                    savedMovie.getTitle()
                            + " is now showing! Check it out and book your tickets.",
                    NotificationType.PROMOTION
            );
        }

        return toResponse(savedMovie);
    }

    @Override
    public void deleteMovie(Long movieId) {
        Movie movie = findMovie(movieId);
        movie.setStatus(MovieStatus.INACTIVE);
        movieRepository.save(movie);
    }

    private Movie findMovie(Long id) {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("movieId must be a positive number.");
        }
        return movieRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Movie not found with id: " + id));
    }

    private Pageable pageable(int page, int size, String sortBy, String direction) {
        if (page < 0) throw new IllegalArgumentException("page must be zero or greater.");
        if (size < 1 || size > 100) throw new IllegalArgumentException("size must be between 1 and 100.");

        String field = StringUtils.hasText(sortBy) ? sortBy.trim() : "createdAt";
        if (!SORT_FIELDS.contains(field)) {
            throw new IllegalArgumentException("Unsupported sortBy field. Allowed fields: " + SORT_FIELDS);
        }

        String dir = StringUtils.hasText(direction) ? direction.trim().toLowerCase(Locale.ROOT) : "asc";
        Sort sort;
        if (dir.equals("asc") || dir.equals("ascending")) {
            sort = Sort.by(Sort.Direction.ASC, field);
        } else if (dir.equals("desc") || dir.equals("descending")) {
            sort = Sort.by(Sort.Direction.DESC, field);
        } else {
            throw new IllegalArgumentException("direction must be asc/ascending or desc/descending.");
        }
        return PageRequest.of(page, size, sort);
    }

    private PageResponse<MovieResponse> toPageResponse(Page<Movie> page) {
        return new PageResponse<>(
            page.getContent().stream().map(this::toResponse).toList(),
            page.getNumber(), page.getSize(), page.getTotalElements(),
            page.getTotalPages(), page.isLast()
        );
    }

    private MovieResponse toResponse(Movie movie) {
        List<GenreSummaryResponse> genres = movie.getGenres() == null
            ? List.of()
            : movie.getGenres().stream()
                .map(g -> new GenreSummaryResponse(g.getId(), g.getName()))
                .toList();

        return new MovieResponse(
            movie.getId(), movie.getTitle(), movie.getDescription(),
            movie.getDurationMinutes(), movie.getReleaseDate(), movie.getLanguage(),
            movie.getCertificate(), movie.getPosterUrl(), movie.getTrailerUrl(),
            movie.getStatus(), genres, movie.getCreatedAt(), movie.getUpdatedAt()
        );
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
