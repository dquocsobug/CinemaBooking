package com.cinema.cenimabackend.util;

public final class RedisKeyConstants {

    private RedisKeyConstants() {}

    /** seat:lock:{showtimeId}:{seatId} — TTL 300s */
    public static String seatLock(String showtimeId, String seatId) {
        return "seat:lock:" + showtimeId + ":" + seatId;
    }

    /** showtime:locked:{showtimeId} — SET of locked seatIds */
    public static String showtimeLocked(String showtimeId) {
        return "showtime:locked:" + showtimeId;
    }

    /** booking:session:{userId}:{showtimeId} — HASH seatId→price */
    public static String bookingSession(String userId, String showtimeId) {
        return "booking:session:" + userId + ":" + showtimeId;
    }

    /** showtime:seatmap:{showtimeId} — HASH seatId→status */
    public static String seatMap(String showtimeId) {
        return "showtime:seatmap:" + showtimeId;
    }

    /** ratelimit:payment:{userId} */
    public static String paymentRateLimit(String userId) {
        return "ratelimit:payment:" + userId;
    }
}
