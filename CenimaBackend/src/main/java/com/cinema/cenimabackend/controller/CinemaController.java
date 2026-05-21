package com.cinema.cenimabackend.controller;

import com.cinema.cenimabackend.dto.response.ApiResponse;
import com.cinema.cenimabackend.entity.Cinema;
import com.cinema.cenimabackend.service.impl.CinemaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/cinemas")
@RequiredArgsConstructor
public class CinemaController {

    private final CinemaService cinemaService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Cinema>>> getAll(
            @RequestParam(required = false) String city) {
        List<Cinema> result = city != null
                ? cinemaService.getByCity(city)
                : cinemaService.getAll();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Cinema>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(cinemaService.getById(id)));
    }
}