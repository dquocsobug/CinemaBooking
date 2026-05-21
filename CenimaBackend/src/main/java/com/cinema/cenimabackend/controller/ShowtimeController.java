package com.cinema.cenimabackend.controller;

import com.cinema.cenimabackend.dto.response.*;
import com.cinema.cenimabackend.service.impl.*;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.*;

@RestController
@RequestMapping("/api/v1/showtimes")
@RequiredArgsConstructor
public class ShowtimeController {

    private final ShowtimeService showtimeService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ShowtimeResponse>>> getByMovieAndDate(
            @RequestParam UUID movieId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date) {

        Instant target = date != null
                ? date.atStartOfDay().toInstant(ZoneOffset.UTC)
                : Instant.now();

        return ResponseEntity.ok(ApiResponse.ok(
                showtimeService.getByMovieAndDate(movieId, target)
        ));
    }

    @GetMapping("/{id}/seat-map")
    public ResponseEntity<ApiResponse<SeatMapResponse>> getSeatMap(
            @PathVariable UUID id,
            @AuthenticationPrincipal Object principal) {

        String userId = principal != null ? principal.toString() : null;

        return ResponseEntity.ok(ApiResponse.ok(
                showtimeService.getSeatMap(id, userId)
        ));
    }
}