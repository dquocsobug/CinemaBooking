package com.cinema.cenimabackend.event;

import com.cinema.cenimabackend.websocket.SeatWebSocketPublisher;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.listener.KeyExpirationEventMessageListener;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class RedisKeyspaceListener extends KeyExpirationEventMessageListener {

    private final SeatWebSocketPublisher publisher;
    private final StringRedisTemplate redis;

    public RedisKeyspaceListener(
            RedisMessageListenerContainer container,
            SeatWebSocketPublisher publisher,
            StringRedisTemplate redis
    ) {
        super(container);
        this.publisher = publisher;
        this.redis = redis;
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        String expiredKey = message.toString();

        log.debug("Redis key expired: {}", expiredKey);

        // Pattern: seat:lock:{showtimeId}:{seatId}
        if (!expiredKey.startsWith("seat:lock:")) {
            return;
        }

        String[] parts = expiredKey.split(":");

        if (parts.length != 4) {
            log.warn("Invalid seat lock key format: {}", expiredKey);
            return;
        }

        String showtimeId = parts[2];
        String seatId = parts[3];

        log.info("Seat lock expired: showtime={}, seat={}", showtimeId, seatId);

        String lockedSetKey = "showtime:locked:" + showtimeId;
        String seatMapKey = "showtime:seatmap:" + showtimeId;

        try {
            redis.opsForSet().remove(lockedSetKey, seatId);
            redis.opsForHash().put(seatMapKey, seatId, "AVAILABLE");

            publisher.publishSeatReleased(showtimeId, seatId);

        } catch (Exception e) {
            log.error("Failed to clean Redis seat state after lock expired. showtime={}, seat={}",
                    showtimeId, seatId, e);
        }
    }
}