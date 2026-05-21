package com.cinema.cenimabackend.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ShowtimeResponse {
    private UUID id;
    private UUID movieId;
    private String movieTitle;
    private String moviePoster;
    private UUID cinemaId;
    private String cinemaName;
    private UUID roomId;
    private String roomName;
    private String roomType;
    private Instant startTime;
    private Instant endTime;
    private BigDecimal basePrice;
    private String language;
    private String subtitleLang;
    private String format;
    private String status;
}