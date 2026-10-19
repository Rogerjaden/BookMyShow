package com.rogerjaden.bookmyshow.service.impl;

import com.rogerjaden.bookmyshow.dto.request.CreateMovieShowRequest;
import com.rogerjaden.bookmyshow.dto.request.UpdateMovieShowRequest;
import com.rogerjaden.bookmyshow.dto.response.MovieShowResponse;
import com.rogerjaden.bookmyshow.dto.response.PageResponse;
import com.rogerjaden.bookmyshow.entity.Movie;
import com.rogerjaden.bookmyshow.entity.MovieShow;
import com.rogerjaden.bookmyshow.entity.Screen;
import com.rogerjaden.bookmyshow.entity.enums.*;
import com.rogerjaden.bookmyshow.exception.ConflictException;
import com.rogerjaden.bookmyshow.exception.ResourceNotFoundException;
import com.rogerjaden.bookmyshow.repository.MovieRepository;
import com.rogerjaden.bookmyshow.repository.MovieShowRepository;
import com.rogerjaden.bookmyshow.repository.ScreenRepository;
import com.rogerjaden.bookmyshow.service.interfaces.MovieShowService;
import com.rogerjaden.bookmyshow.service.interfaces.ShowSeatService;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Set;

@Service
@Transactional
public class MovieShowServiceImpl implements MovieShowService {
    private static final Set<String> SORT_FIELDS = Set.of("id", "startTime", "endTime", "language", "createdAt", "updatedAt");
    private final MovieShowRepository showRepository;
    private final MovieRepository movieRepository;
    private final ScreenRepository screenRepository;
    private final ShowSeatService showSeatService;

    // Default price used when the create-show request does not specify one.
    private static final BigDecimal DEFAULT_SEAT_PRICE = new BigDecimal("250.00");

    public MovieShowServiceImpl(MovieShowRepository showRepository, MovieRepository movieRepository,
                                ScreenRepository screenRepository, ShowSeatService showSeatService) {
        this.showRepository = showRepository;
        this.movieRepository = movieRepository;
        this.screenRepository = screenRepository;
        this.showSeatService = showSeatService;
    }

    @Override
    public MovieShowResponse createShow(CreateMovieShowRequest request) {
        validateTimes(request.startTime(), request.endTime());
        Movie movie = findMovie(request.movieId());
        if (movie.getStatus() == MovieStatus.INACTIVE || movie.getStatus() == MovieStatus.ENDED) {
            throw new ConflictException("Cannot schedule a show for an inactive or ended movie.");
        }
        Screen screen = findScreen(request.screenId());
        validateScreenAndTheatre(screen);
        ensureNoOverlap(screen.getId(), request.startTime(), request.endTime(), null);

        MovieShow show = new MovieShow();
        show.setMovie(movie);
        show.setScreen(screen);
        show.setStartTime(request.startTime());
        show.setEndTime(request.endTime());
        show.setLanguage(request.language().trim());
        show.setFormat(request.format());
        show.setStatus(request.status() == null ? ShowStatus.SCHEDULED : request.status());
        if (show.getStatus() == ShowStatus.COMPLETED) {
            throw new IllegalArgumentException("A new show cannot be created with COMPLETED status.");
        }
        // Save the show first so it has an ID, then create one ShowSeat row
        // for every ACTIVE physical seat assigned to this screen. Both operations
        // participate in this service transaction, so a failure rolls back both.
        MovieShow savedShow = showRepository.save(show);
        showSeatService.generateInventoryForShow(savedShow.getId(), DEFAULT_SEAT_PRICE);
        return toResponse(savedShow);
    }

    @Override
    public MovieShowResponse updateShow(Long showId, UpdateMovieShowRequest request) {
        MovieShow show = findShow(showId);
        if (show.getStatus() != ShowStatus.SCHEDULED) {
            throw new ConflictException("Only scheduled shows can be updated.");
        }
        validateTimes(request.startTime(), request.endTime());
        ensureNoOverlap(show.getScreen().getId(), request.startTime(), request.endTime(), showId);
        if (request.status() == ShowStatus.COMPLETED) {
            throw new IllegalArgumentException("Use the show lifecycle process to mark a show completed.");
        }
        show.setStartTime(request.startTime());
        show.setEndTime(request.endTime());
        show.setLanguage(request.language().trim());
        show.setFormat(request.format());
        show.setStatus(request.status());
        return toResponse(showRepository.save(show));
    }

    @Override
    @Transactional(readOnly = true)
    public MovieShowResponse getShowById(Long showId) {
        return toResponse(findShow(showId));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<MovieShowResponse> findShows(Long movieId, String city, LocalDate date,
            String language, String format, int page, int size, String sortBy, String direction) {
        if (movieId != null && movieId <= 0) throw new IllegalArgumentException("movieId must be positive.");
        Pageable pageable = pageable(page, size, sortBy, direction);
        LocalDateTime from = date == null ? null : date.atStartOfDay();
        LocalDateTime to = date == null ? null : date.plusDays(1).atStartOfDay();
        String normalizedCity = StringUtils.hasText(city) ? city.trim() : null;
        String normalizedLanguage = StringUtils.hasText(language) ? language.trim() : null;
        MovieFormat movieFormat = null;
        if (StringUtils.hasText(format)) {
            try { movieFormat = MovieFormat.valueOf(format.trim().toUpperCase(Locale.ROOT)); }
            catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Unsupported format. Allowed values: " + java.util.Arrays.toString(MovieFormat.values()));
            }
        }
        Page<MovieShow> result = showRepository.searchShows(ShowStatus.SCHEDULED, movieId,
                normalizedCity, from, to, normalizedLanguage, movieFormat, pageable);
        return new PageResponse<>(result.getContent().stream().map(this::toResponse).toList(),
                result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages(), result.isLast());
    }

    @Override
    public void cancelShow(Long showId) {
        MovieShow show = findShow(showId);
        if (show.getStatus() == ShowStatus.COMPLETED) throw new ConflictException("A completed show cannot be cancelled.");
        if (show.getStatus() == ShowStatus.CANCELLED) return;
        show.setStatus(ShowStatus.CANCELLED);
        showRepository.save(show);
    }

    private void validateTimes(LocalDateTime start, LocalDateTime end) {
        if (start == null || end == null || !end.isAfter(start)) {
            throw new IllegalArgumentException("endTime must be later than startTime.");
        }
        if (!start.isAfter(LocalDateTime.now())) throw new IllegalArgumentException("Show startTime must be in the future.");
    }

    private void ensureNoOverlap(Long screenId, LocalDateTime start, LocalDateTime end, Long excludingShowId) {
        boolean overlap = showRepository.findByScreen_IdAndStartTimeLessThanAndEndTimeGreaterThan(screenId, end, start)
                .stream().anyMatch(existing -> existing.getStatus() == ShowStatus.SCHEDULED
                        && (excludingShowId == null || !existing.getId().equals(excludingShowId)));
        if (overlap) throw new ConflictException("This screen already has a scheduled show during the requested time.");
    }

    private void validateScreenAndTheatre(Screen screen) {
        if (screen.getStatus() != ScreenStatus.ACTIVE) throw new ConflictException("Cannot schedule a show on an inactive screen.");
        if (screen.getTheatre().getStatus() != TheatreStatus.ACTIVE) throw new ConflictException("Cannot schedule a show at an inactive theatre.");
    }

    private Movie findMovie(Long id) {
        if (id == null || id <= 0) throw new IllegalArgumentException("movieId must be positive.");
        return movieRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Movie not found with id: " + id));
    }
    private Screen findScreen(Long id) {
        if (id == null || id <= 0) throw new IllegalArgumentException("screenId must be positive.");
        return screenRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Screen not found with id: " + id));
    }
    private MovieShow findShow(Long id) {
        if (id == null || id <= 0) throw new IllegalArgumentException("showId must be positive.");
        return showRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Show not found with id: " + id));
    }

    private Pageable pageable(int page, int size, String sortBy, String direction) {
        if (page < 0) throw new IllegalArgumentException("page must be zero or greater.");
        if (size < 1 || size > 100) throw new IllegalArgumentException("size must be between 1 and 100.");
        String field = StringUtils.hasText(sortBy) ? sortBy.trim() : "startTime";
        if (!SORT_FIELDS.contains(field)) throw new IllegalArgumentException("Unsupported sortBy field. Allowed: " + SORT_FIELDS);
        String dir = StringUtils.hasText(direction) ? direction.trim().toLowerCase(Locale.ROOT) : "asc";
        if (dir.equals("asc") || dir.equals("ascending")) return PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, field));
        if (dir.equals("desc") || dir.equals("descending")) return PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, field));
        throw new IllegalArgumentException("direction must be asc or desc.");
    }

    private MovieShowResponse toResponse(MovieShow s) {
        return new MovieShowResponse(s.getId(), s.getMovie().getId(), s.getMovie().getTitle(),
                s.getScreen().getId(), s.getScreen().getScreenName(), s.getScreen().getTheatre().getId(),
                s.getScreen().getTheatre().getName(), s.getScreen().getTheatre().getCity(), s.getStartTime(),
                s.getEndTime(), s.getLanguage(), s.getFormat(), s.getStatus(), s.getCreatedAt(), s.getUpdatedAt());
    }
}
