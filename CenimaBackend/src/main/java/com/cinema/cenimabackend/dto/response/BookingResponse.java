package com.cinema.cenimabackend.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class BookingResponse {
    private UUID id;
    private String bookingCode;
    private String status;
    private ShowtimeResponse showtime;
    private List<SeatResponse> seats;
    private BigDecimal totalPrice;
    private BigDecimal discountAmount;
    private BigDecimal finalPrice;
    private String voucherCode;
    private Instant expiresAt;
    private Instant createdAt;
}