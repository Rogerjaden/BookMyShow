package com.rogerjaden.bookmyshow.repository;

import com.rogerjaden.bookmyshow.entity.Movie;
import com.rogerjaden.bookmyshow.entity.enums.MovieStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MovieRepository extends JpaRepository<Movie, Long> {
    boolean existsByTitleIgnoreCase(String title);

    boolean existsByGenres_Id(Long genreId);

    @Query("""
        select distinct m from Movie m
        where m.status <> :inactiveStatus
          and (:query is null or lower(m.title) like lower(concat('%', :query, '%')))
          and (:language is null or lower(m.language) = lower(:language))
          and (:genreId is null or exists (
              select g.id from m.genres g where g.id = :genreId
          ))
        """)
    Page<Movie> searchMovies(
        @Param("query") String query,
        @Param("language") String language,
        @Param("genreId") Long genreId,
        @Param("inactiveStatus") MovieStatus inactiveStatus,
        Pageable pageable
    );
}
