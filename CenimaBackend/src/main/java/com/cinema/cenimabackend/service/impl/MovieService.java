package com.cinema.cenimabackend.service.impl;

import com.cinema.cenimabackend.dto.response.*;
import com.cinema.cenimabackend.entity.Movie;
import com.cinema.cenimabackend.enums.MovieStatus;
import com.cinema.cenimabackend.exception.ResourceNotFoundException;
import com.cinema.cenimabackend.repository.MovieRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MovieService {

    private final MovieRepository movieRepository;

    // FIX #15: key bao gồm cả pageSize để tránh cache conflict khi client dùng size khác nhau
    @Cacheable(value = "movies", key = "'now_showing_p' + #pageable.pageNumber + '_s' + #pageable.pageSize")
    @Transactional(readOnly = true)
    public PageResponse<MovieResponse> getNowShowing(Pageable pageable) {
        Page<Movie> page = movieRepository.findByStatus(MovieStatus.NOW_SHOWING, pageable);
        return PageResponse.of(page.map(this::toResponse));
    }

    @Cacheable(value = "movies", key = "'coming_soon_p' + #pageable.pageNumber + '_s' + #pageable.pageSize")
    @Transactional(readOnly = true)
    public PageResponse<MovieResponse> getComingSoon(Pageable pageable) {
        Page<Movie> page = movieRepository.findByStatus(MovieStatus.COMING_SOON, pageable);
        return PageResponse.of(page.map(this::toResponse));
    }

    @Cacheable(value = "movies", key = "'slug_' + #slug")
    @Transactional(readOnly = true)
    public MovieResponse getBySlug(String slug) {
        Movie movie = movieRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Phim không tồn tại"));
        return toResponse(movie);
    }

    // Search không cache vì query động; Redis sẽ chỉ tốn bộ nhớ cho các query hiếm gặp
    @Transactional(readOnly = true)
    public PageResponse<MovieResponse> search(String q, Pageable pageable) {
        return PageResponse.of(movieRepository.search(q, pageable).map(this::toResponse));
    }

    public MovieResponse toResponse(Movie m) {
        return MovieResponse.builder()
                .id(m.getId())
                .title(m.getTitle())
                .originalTitle(m.getOriginalTitle())
                .slug(m.getSlug())
                .description(m.getDescription())
                .durationMin(m.getDurationMin())
                .releaseDate(m.getReleaseDate())
                .language(m.getLanguage())
                .country(m.getCountry())
                .director(m.getDirector())
                .posterUrl(m.getPosterUrl())
                .trailerUrl(m.getTrailerUrl())
                .rating(m.getRating())
                .ageRating(m.getAgeRating())
                .status(m.getStatus().name())
                .genres(m.getGenres().stream()
                        .map(g -> g.getName())
                        .collect(Collectors.toList()))
                .build();
    }
}
