package com.rogerjaden.bookmyshow.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name="movie_genre")
public class MovieGenre {
    @EmbeddedId
    private MovieGenreId id;

    @ManyToOne(fetch=FetchType.LAZY, optional=false)
    @MapsId("movieId") @JoinColumn(name="movie_id", nullable=false)
    private Movie movie;

    @ManyToOne(fetch=FetchType.LAZY, optional=false)
    @MapsId("genreId") @JoinColumn(name="genre_id", nullable=false)
    private Genre genre;

}
