package com.cinema.cenimabackend.dto.response;

import lombok.*;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SeatMapResponse {
    private String showtimeId;
    private List<SeatResponse> seats;
    private int totalAvailable;
    private int totalLocked;
    private int totalBooked;
}