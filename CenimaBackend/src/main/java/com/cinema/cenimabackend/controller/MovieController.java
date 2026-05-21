package com.cinema.cenimabackend.controller;

import com.cinema.cenimabackend.dto.response.*;
import com.cinema.cenimabackend.service.impl.MovieService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/movies")
@RequiredArgsConstructor
public class MovieController {

    private final MovieService movieService;

    @GetMapping("/now-showing")
    public ResponseEntity<ApiResponse<PageResponse<MovieResponse>>> nowShowing(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("releaseDate").descending());
        return ResponseEntity.ok(ApiResponse.ok(movieService.getNowShowing(pageable)));
    }

    @GetMapping("/coming-soon")
    public ResponseEntity<ApiResponse<PageResponse<MovieResponse>>> comingSoon(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("releaseDate").ascending());
        return ResponseEntity.ok(ApiResponse.ok(movieService.getComingSoon(pageable)));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<ApiResponse<MovieResponse>> getBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(ApiResponse.ok(movieService.getBySlug(slug)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PageResponse<MovieResponse>>> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                movieService.search(q, PageRequest.of(page, size))));
    }
}