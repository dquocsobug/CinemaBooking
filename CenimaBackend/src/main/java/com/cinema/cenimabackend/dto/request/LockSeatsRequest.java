package com.cinema.cenimabackend.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.util.*;

@Data
public class LockSeatsRequest {
    @NotNull
    private UUID showtimeId;

    @NotEmpty @Size(min = 1, max = 8)
    private List<UUID> seatIds;
}