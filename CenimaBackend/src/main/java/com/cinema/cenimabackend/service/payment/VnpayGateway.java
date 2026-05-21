package com.cinema.cenimabackend.service.payment;

import com.cinema.cenimabackend.enums.PaymentMethod;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@Slf4j
@Component
public class VnpayGateway implements PaymentGateway {

    @Value("${payment.vnpay.tmn-code}")
    private String tmnCode;

    @Value("${payment.vnpay.hash-secret}")
    private String hashSecret;

    @Value("${payment.vnpay.pay-url}")
    private String payUrl;

    @Value("${payment.vnpay.return-url}")
    private String returnUrl;

    @Override
    public PaymentMethod supports() {
        return PaymentMethod.VNPAY;
    }

    @Override
    public PaymentInitResult initiate(String bookingCode, BigDecimal amount, String frontendReturnUrl) {
        try {
            String txnRef = bookingCode + "_" + System.currentTimeMillis();
            String orderInfo = "Thanh toan ve xem phim " + bookingCode;
            String redirectUrl = frontendReturnUrl != null && !frontendReturnUrl.isBlank()
                    ? frontendReturnUrl
                    : returnUrl;

            Calendar calendar = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
            SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
            String createDate = formatter.format(calendar.getTime());

            calendar.add(Calendar.MINUTE, 15);
            String expireDate = formatter.format(calendar.getTime());

            Map<String, String> params = new HashMap<>();
            params.put("vnp_Version", "2.1.0");
            params.put("vnp_Command", "pay");
            params.put("vnp_TmnCode", tmnCode);
            params.put("vnp_Amount", String.valueOf(amount.multiply(BigDecimal.valueOf(100)).longValue()));
            params.put("vnp_CurrCode", "VND");
            params.put("vnp_TxnRef", txnRef);
            params.put("vnp_OrderInfo", orderInfo);
            params.put("vnp_OrderType", "other");
            params.put("vnp_Locale", "vn");
            params.put("vnp_ReturnUrl", redirectUrl);
            params.put("vnp_IpAddr", "127.0.0.1");
            params.put("vnp_CreateDate", createDate);
            params.put("vnp_ExpireDate", expireDate);

            List<String> fieldNames = new ArrayList<>(params.keySet());
            Collections.sort(fieldNames);

            StringBuilder hashData = new StringBuilder();
            StringBuilder query = new StringBuilder();

            for (int i = 0; i < fieldNames.size(); i++) {
                String fieldName = fieldNames.get(i);
                String fieldValue = params.get(fieldName);

                if (fieldValue != null && !fieldValue.isBlank()) {
                    hashData.append(fieldName)
                            .append("=")
                            .append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));

                    query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII))
                            .append("=")
                            .append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));

                    if (i < fieldNames.size() - 1) {
                        hashData.append("&");
                        query.append("&");
                    }
                }
            }

            String secureHash = hmacSHA512(hashSecret, hashData.toString());
            query.append("&vnp_SecureHash=").append(secureHash);

            String paymentUrl = payUrl + "?" + query;

            log.info("VNPay payment created for booking {}: {}", bookingCode, paymentUrl);

            return PaymentInitResult.builder()
                    .paymentUrl(paymentUrl)
                    .transactionRef(txnRef)
                    .build();

        } catch (Exception e) {
            log.error("VNPay initiate error", e);
            throw new RuntimeException("Không thể tạo thanh toán VNPay: " + e.getMessage());
        }
    }

    @Override
    public PaymentVerifyResult verify(Map<String, Object> callbackData) {
        try {
            Map<String, String> params = new HashMap<>();

            for (Map.Entry<String, Object> entry : callbackData.entrySet()) {
                if (entry.getValue() != null) {
                    params.put(entry.getKey(), String.valueOf(entry.getValue()));
                }
            }

            String receivedHash = params.remove("vnp_SecureHash");
            params.remove("vnp_SecureHashType");

            List<String> fieldNames = new ArrayList<>(params.keySet());
            Collections.sort(fieldNames);

            StringBuilder hashData = new StringBuilder();

            for (int i = 0; i < fieldNames.size(); i++) {
                String fieldName = fieldNames.get(i);
                String fieldValue = params.get(fieldName);

                if (fieldValue != null && !fieldValue.isBlank()) {
                    hashData.append(fieldName)
                            .append("=")
                            .append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));

                    if (i < fieldNames.size() - 1) {
                        hashData.append("&");
                    }
                }
            }

            String calculatedHash = hmacSHA512(hashSecret, hashData.toString());

            boolean validSignature = calculatedHash.equalsIgnoreCase(receivedHash);
            boolean success = validSignature
                    && "00".equals(params.get("vnp_ResponseCode"))
                    && "00".equals(params.get("vnp_TransactionStatus"));

            String txnRef = params.getOrDefault("vnp_TxnRef", "");

            return PaymentVerifyResult.builder()
                    .success(success)
                    .transactionId(txnRef)
                    .message(success ? "Thanh toán VNPay thành công" : "Thanh toán VNPay thất bại hoặc sai chữ ký")
                    .build();

        } catch (Exception e) {
            log.error("VNPay verify error", e);

            return PaymentVerifyResult.builder()
                    .success(false)
                    .transactionId("")
                    .message("Không thể xác minh callback VNPay")
                    .build();
        }
    }

    private String hmacSHA512(String key, String data) throws Exception {
        Mac hmac512 = Mac.getInstance("HmacSHA512");
        SecretKeySpec secretKeySpec = new SecretKeySpec(
                key.getBytes(StandardCharsets.UTF_8),
                "HmacSHA512"
        );

        hmac512.init(secretKeySpec);

        byte[] bytes = hmac512.doFinal(data.getBytes(StandardCharsets.UTF_8));

        StringBuilder hash = new StringBuilder();
        for (byte b : bytes) {
            hash.append(String.format("%02x", b));
        }

        return hash.toString();
    }
}