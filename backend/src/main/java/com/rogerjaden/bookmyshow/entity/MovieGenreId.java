package com.rogerjaden.bookmyshow.entity;
import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
@Embeddable
public class MovieGenreId implements Serializable {

    @Column(name="movie_id")
    private Long movieId;

    @Column(name="genre_id")
    private Long genreId;

}
