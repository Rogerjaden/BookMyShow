package com.rogerjaden.bookmyshow.repository;

import com.rogerjaden.bookmyshow.entity.MovieShow;
import com.rogerjaden.bookmyshow.entity.enums.ShowStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface MovieShowRepository extends JpaRepository<MovieShow, Long> {
    @Query("""
        select s from MovieShow s
        where s.status = :status
          and (:movieId is null or s.movie.id = :movieId)
          and (:city is null or lower(s.screen.theatre.city) = lower(:city))
          and (:fromTime is null or s.startTime >= :fromTime)
          and (:toTime is null or s.startTime < :toTime)
          and (:language is null or lower(s.language) = lower(:language))
          and (:format is null or s.format = :format)
        """)
    Page<MovieShow> searchShows(
            @Param("status") ShowStatus status,
            @Param("movieId") Long movieId,
            @Param("city") String city,
            @Param("fromTime") LocalDateTime fromTime,
            @Param("toTime") LocalDateTime toTime,
            @Param("language") String language,
            @Param("format") com.rogerjaden.bookmyshow.entity.enums.MovieFormat format,
            Pageable pageable);

    List<MovieShow> findByScreen_IdAndStartTimeLessThanAndEndTimeGreaterThan(
            Long screenId, LocalDateTime proposedEnd, LocalDateTime proposedStart);

    List<MovieShow> findByMovie_IdAndStatusAndStartTimeAfterOrderByStartTimeAsc(
            Long movieId, ShowStatus status, LocalDateTime now);

    // Retained from the project's previous repository API.
    Page<MovieShow> findByMovie_IdAndStartTimeBetweenAndStatus(
            Long movieId, LocalDateTime from, LocalDateTime to, ShowStatus status, Pageable pageable);
    List<MovieShow> findByScreen_IdAndStartTimeBetween(Long screenId, LocalDateTime from, LocalDateTime to);
    Page<MovieShow> findByScreen_Theatre_CityIgnoreCaseAndStartTimeBetweenAndStatus(
            String city, LocalDateTime from, LocalDateTime to, ShowStatus status, Pageable pageable);
    @Query("""
    SELECT ms FROM MovieShow ms
    JOIN FETCH ms.movie
    JOIN FETCH ms.screen s
    JOIN FETCH s.theatre
    WHERE ms.id = :id
    """)
    Optional<MovieShow> findByIdWithDetails(@Param("id") Long id);
}
