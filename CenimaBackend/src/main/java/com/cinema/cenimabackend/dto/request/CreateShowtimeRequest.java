package com.cinema.cenimabackend.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
public class CreateShowtimeRequest {
    @NotNull private UUID movieId;
    @NotNull private UUID roomId;
    @NotNull private Instant startTime;
    @NotNull @DecimalMin("0") private BigDecimal basePrice;
    private String language;
    private String subtitleLang;
    private String format;
}