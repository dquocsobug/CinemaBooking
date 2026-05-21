package com.cinema.cenimabackend.controller;

import com.cinema.cenimabackend.dto.request.ReviewRequest;
import com.cinema.cenimabackend.dto.response.*;
import com.cinema.cenimabackend.service.impl.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<ApiResponse<ReviewResponse>> create(
            @Valid @RequestBody ReviewRequest req,
            @AuthenticationPrincipal UUID userId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Cảm ơn bạn đã đánh giá!", reviewService.create(req, userId)));
    }

    @GetMapping("/movie/{movieId}")
    public ResponseEntity<ApiResponse<PageResponse<ReviewResponse>>> getByMovie(
            @PathVariable UUID movieId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                reviewService.getByMovie(movieId, PageRequest.of(page, size,
                        Sort.by("createdAt").descending()))));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal UUID userId) {
        reviewService.delete(id, userId);
        return ResponseEntity.ok(ApiResponse.ok("Đã xóa đánh giá", null));
    }
}