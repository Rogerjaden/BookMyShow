package com.rogerjaden.bookmyshow.repository;

import com.rogerjaden.bookmyshow.entity.MovieGenre;
import com.rogerjaden.bookmyshow.entity.MovieGenreId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MovieGenreRepository extends JpaRepository<MovieGenre, MovieGenreId> {
    List<MovieGenre> findByMovie_Id(Long movieId);
    List<MovieGenre> findByGenre_Id(Long genreId);
    boolean existsByMovie_IdAndGenre_Id(Long movieId, Long genreId);
    void deleteByMovie_IdAndGenre_Id(Long movieId, Long genreId);
    void deleteByMovie_Id(Long movieId);
}
