package com.cinema.cenimabackend.dto.request;

import lombok.Data;
import java.util.Map;

@Data
public class PaymentCallbackRequest {
    private String transactionId;
    private String bookingCode;
    private String status;           // SUCCESS / FAILED
    private Map<String, Object> rawData;
}