package com.cinema.cenimabackend.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.util.UUID;

@Data
public class ReviewRequest {
    @NotNull
    private UUID movieId;

    @NotNull @Min(1) @Max(10)
    private Short rating;

    @Size(max = 2000)
    private String comment;

    private boolean spoiler;
}