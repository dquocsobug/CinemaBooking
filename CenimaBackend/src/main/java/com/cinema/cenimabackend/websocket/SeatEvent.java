package com.cinema.cenimabackend.websocket;

import lombok.*;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeatEvent {

    private String type;        // SEAT_LOCKED | SEAT_RELEASED | SEAT_BOOKED

    private String showtimeId;

    private String seatId;

    private String seatCode;

    private String status;      // LOCKED | AVAILABLE | BOOKED

    @Builder.Default
    private Instant timestamp = Instant.now();
}