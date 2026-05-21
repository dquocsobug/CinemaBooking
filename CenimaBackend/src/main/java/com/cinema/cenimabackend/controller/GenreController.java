package com.cinema.cenimabackend.controller;

import com.cinema.cenimabackend.dto.response.ApiResponse;
import com.cinema.cenimabackend.entity.Genre;
import com.cinema.cenimabackend.repository.GenreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/genres")
@RequiredArgsConstructor
public class GenreController {

    private final GenreRepository genreRepository;

    @GetMapping
    @Cacheable("genres")
    public ResponseEntity<ApiResponse<List<Genre>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(genreRepository.findAllByOrderByNameAsc()));
    }
}