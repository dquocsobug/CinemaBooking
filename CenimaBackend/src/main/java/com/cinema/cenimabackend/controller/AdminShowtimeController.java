package com.cinema.cenimabackend.controller;

import com.cinema.cenimabackend.dto.request.CreateShowtimeRequest;
import com.cinema.cenimabackend.dto.response.*;
import com.cinema.cenimabackend.service.impl.ShowtimeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/showtimes")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminShowtimeController {

    private final ShowtimeService showtimeService;

    @PostMapping
    public ResponseEntity<ApiResponse<ShowtimeResponse>> create(
            @Valid @RequestBody CreateShowtimeRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Tạo suất chiếu thành công",
                        showtimeService.create(req)));
    }
}