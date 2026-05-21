package com.cinema.cenimabackend.controller;

import com.cinema.cenimabackend.dto.request.*;
import com.cinema.cenimabackend.dto.response.*;
import com.cinema.cenimabackend.service.impl.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    /** BƯỚC 1: Lock ghế */
    @PostMapping("/lock-seats")
    public ResponseEntity<ApiResponse<List<String>>> lockSeats(
            @Valid @RequestBody LockSeatsRequest req,
            @AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(ApiResponse.ok(
                "Ghế đã được giữ trong 5 phút",
                bookingService.lockSeats(req, userId)));
    }

    /** BƯỚC 2: Tạo booking */
    @PostMapping
    public ResponseEntity<ApiResponse<BookingResponse>> create(
            @Valid @RequestBody CreateBookingRequest req,
            @AuthenticationPrincipal UUID userId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Tạo booking thành công",
                        bookingService.createBooking(req, userId)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<BookingResponse>>> getMyBookings(
            @AuthenticationPrincipal UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                bookingService.getUserBookings(userId, PageRequest.of(page, size))));
    }

    @GetMapping("/{code}")
    public ResponseEntity<ApiResponse<BookingResponse>> getByCode(
            @PathVariable String code,
            @AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(ApiResponse.ok(bookingService.getByCode(code, userId)));
    }
}