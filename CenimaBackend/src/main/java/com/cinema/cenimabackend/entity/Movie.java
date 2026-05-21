package com.cinema.cenimabackend.entity;

import com.cinema.cenimabackend.enums.MovieStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Entity @Table(name = "movies")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Movie extends BaseEntity {

    @Id @UuidGenerator
    @Column(columnDefinition = "uuid", updatable = false)
    private UUID id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(name = "original_title", length = 255)
    private String originalTitle;

    @Column(nullable = false, unique = true, length = 300)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "duration_min", nullable = false)
    private Short durationMin;

    @Column(name = "release_date", nullable = false)
    private LocalDate releaseDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(length = 60)
    private String language;

    @Column(length = 80)
    private String country;

    @Column(length = 150)
    private String director;

    @Column(name = "cast_list", columnDefinition = "TEXT")
    private String castList;

    @Column(name = "poster_url", length = 500)
    private String posterUrl;

    @Column(name = "trailer_url", length = 500)
    private String trailerUrl;

    @Column(precision = 3, scale = 1)
    private BigDecimal rating;

    @Column(name = "age_rating", length = 10)
    private String ageRating;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private MovieStatus status = MovieStatus.COMING_SOON;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "movie_genres",
            joinColumns = @JoinColumn(name = "movie_id"),
            inverseJoinColumns = @JoinColumn(name = "genre_id"))
    @Builder.Default
    private Set<Genre> genres = new HashSet<>();
}