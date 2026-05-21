package com.cinema.cenimabackend.dto.request;

import com.cinema.cenimabackend.enums.PaymentMethod;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.util.UUID;

@Data
public class PaymentRequest {
    @NotNull
    private UUID bookingId;

    @NotNull
    private PaymentMethod method;

    private String returnUrl;
}