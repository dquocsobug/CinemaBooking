package com.cinema.cenimabackend.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class MovieResponse {
    private UUID id;
    private String title;
    private String originalTitle;
    private String slug;
    private String description;
    private Short durationMin;
    private LocalDate releaseDate;
    private String language;
    private String country;
    private String director;
    private String posterUrl;
    private String trailerUrl;
    private BigDecimal rating;
    private String ageRating;
    private String status;
    private List<String> genres;
}