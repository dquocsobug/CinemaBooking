package com.cinema.cenimabackend.service.payment;

import com.cinema.cenimabackend.enums.PaymentMethod;

import java.math.BigDecimal;
import java.util.Map;

public interface PaymentGateway {

    PaymentMethod supports();

    PaymentInitResult initiate(String bookingCode, BigDecimal amount, String returnUrl);

    PaymentVerifyResult verify(Map<String, Object> callbackData);
}