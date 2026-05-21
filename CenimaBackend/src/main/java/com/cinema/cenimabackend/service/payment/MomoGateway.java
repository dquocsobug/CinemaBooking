package com.cinema.cenimabackend.service.payment;

import com.cinema.cenimabackend.enums.PaymentMethod;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Slf4j
@Component
public class MomoGateway implements PaymentGateway {

    @Value("${payment.momo.partner-code}")
    private String partnerCode;

    @Value("${payment.momo.access-key}")
    private String accessKey;

    @Value("${payment.momo.secret-key}")
    private String secretKey;

    @Value("${payment.momo.endpoint}")
    private String endpoint;

    @Value("${payment.momo.return-url}")
    private String returnUrl;

    @Value("${payment.momo.notify-url}")
    private String notifyUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public PaymentMethod supports() {
        return PaymentMethod.MOMO;
    }

    @Override
    public PaymentVerifyResult verify(Map<String, Object> callbackData) {
        String resultCode = String.valueOf(callbackData.getOrDefault("resultCode", "-1"));
        String orderId = String.valueOf(callbackData.getOrDefault("orderId", ""));

        boolean success = "0".equals(resultCode);

        return PaymentVerifyResult.builder()
                .success(success)
                .transactionId(orderId)
                .message(success ? "Thanh toán MoMo thành công" : "Thanh toán MoMo thất bại")
                .build();
    }

    @Override
    public PaymentInitResult initiate(
            String bookingCode,
            BigDecimal amount,
            String frontendReturnUrl
    ) {
        try {
            String requestId = UUID.randomUUID().toString();

            String orderId = bookingCode + "_" + System.currentTimeMillis();

            String orderInfo = "Thanh toán vé xem phim " + bookingCode;

            String requestType = "captureWallet";

            String extraData = "";

            String redirectUrl = frontendReturnUrl != null && !frontendReturnUrl.isBlank()
                    ? frontendReturnUrl
                    : returnUrl;

            String amountValue = String.valueOf(amount.longValue());

            String rawSignature =
                    "accessKey=" + accessKey +
                            "&amount=" + amountValue +
                            "&extraData=" + extraData +
                            "&ipnUrl=" + notifyUrl +
                            "&orderId=" + orderId +
                            "&orderInfo=" + orderInfo +
                            "&partnerCode=" + partnerCode +
                            "&redirectUrl=" + redirectUrl +
                            "&requestId=" + requestId +
                            "&requestType=" + requestType;

            String signature = hmacSHA256(rawSignature, secretKey);

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("partnerCode", partnerCode);
            body.put("partnerName", "Cinema Booking");
            body.put("storeId", "CinemaStore");
            body.put("requestId", requestId);
            body.put("amount", amountValue);
            body.put("orderId", orderId);
            body.put("orderInfo", orderInfo);
            body.put("redirectUrl", redirectUrl);
            body.put("ipnUrl", notifyUrl);
            body.put("lang", "vi");
            body.put("extraData", extraData);
            body.put("requestType", requestType);
            body.put("signature", signature);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            ResponseEntity<String> response = restTemplate.exchange(
                    endpoint,
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    String.class
            );

            JsonNode json = objectMapper.readTree(response.getBody());

            String payUrl = json.path("payUrl").asText(null);

            if (payUrl == null || payUrl.isBlank()) {
                throw new RuntimeException("MoMo không trả về payUrl: " + response.getBody());
            }

            log.info("MoMo payment created for booking {}: {}", bookingCode, payUrl);

            return PaymentInitResult.builder()
                    .paymentUrl(payUrl)
                    .transactionRef(orderId)
                    .build();

        } catch (Exception e) {
            log.error("MoMo initiate error", e);
            throw new RuntimeException("Không thể tạo thanh toán MoMo: " + e.getMessage());
        }
    }

    private String hmacSHA256(String data, String key) throws Exception {
        Mac hmacSHA256 = Mac.getInstance("HmacSHA256");

        SecretKeySpec secretKeySpec = new SecretKeySpec(
                key.getBytes(StandardCharsets.UTF_8),
                "HmacSHA256"
        );

        hmacSHA256.init(secretKeySpec);

        byte[] hash = hmacSHA256.doFinal(data.getBytes(StandardCharsets.UTF_8));

        StringBuilder sb = new StringBuilder();

        for (byte b : hash) {
            sb.append(String.format("%02x", b));
        }

        return sb.toString();
    }
}