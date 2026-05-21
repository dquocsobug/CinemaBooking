package com.cinema.cenimabackend.service;

import com.cinema.cenimabackend.enums.SeatStatus;
import com.cinema.cenimabackend.exception.SeatAlreadyLockedException;
import com.cinema.cenimabackend.util.RedisKeyConstants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class SeatLockService {

    private final StringRedisTemplate redis;

    @Value("${app.seat-lock.ttl-seconds:300}")
    private long lockTtlSeconds;

    public List<String> lockSeats(String showtimeId, List<String> seatIds, String userId) {
        List<String> keys = new ArrayList<>();

        for (String seatId : seatIds) {
            keys.add(RedisKeyConstants.seatLock(showtimeId, seatId));
        }

        String lua = """
        for i=1,#KEYS do
            local owner = redis.call('GET', KEYS[i])

            if owner and owner ~= ARGV[1] then
                return KEYS[i]
            end
        end

        for i=1,#KEYS do
            redis.call('SET', KEYS[i], ARGV[1], 'EX', ARGV[2])
        end

        return 'OK'
        """;

        Object result = redis.execute(
                new DefaultRedisScript<>(lua, Object.class),
                keys,
                userId,
                String.valueOf(lockTtlSeconds)
        );

        if (!"OK".equals(String.valueOf(result))) {
            throw new SeatAlreadyLockedException("Một hoặc nhiều ghế đã bị giữ");
        }

        redis.executePipelined((RedisCallback<Object>) connection -> {
            byte[] setKey = redis.getStringSerializer()
                    .serialize(RedisKeyConstants.showtimeLocked(showtimeId));

            byte[] hashKey = redis.getStringSerializer()
                    .serialize(RedisKeyConstants.seatMap(showtimeId));

            for (String seatId : seatIds) {
                byte[] seat = redis.getStringSerializer().serialize(seatId);

                connection.sAdd(setKey, seat);
                connection.hSet(
                        hashKey,
                        seat,
                        redis.getStringSerializer().serialize(SeatStatus.LOCKED.name())
                );
            }

            return null;
        });

        redis.expire(
                RedisKeyConstants.bookingSession(userId, showtimeId),
                Duration.ofSeconds(lockTtlSeconds)
        );

        log.info("User {} locked {} seats", userId, seatIds.size());

        return seatIds;
    }

    public void releaseSeats(String showtimeId, List<String> seatIds, String userId) {
        if (seatIds == null || seatIds.isEmpty()) {
            return;
        }

        String lockedSetKey = RedisKeyConstants.showtimeLocked(showtimeId);
        String seatMapKey = RedisKeyConstants.seatMap(showtimeId);

        if (userId == null) {
            redis.executePipelined((RedisCallback<Object>) connection -> {
                byte[] setKeyBytes = redis.getStringSerializer().serialize(lockedSetKey);
                byte[] hashKeyBytes = redis.getStringSerializer().serialize(seatMapKey);
                byte[] availableBytes = redis.getStringSerializer().serialize(SeatStatus.AVAILABLE.name());

                for (String seatId : seatIds) {
                    byte[] lockKeyBytes = redis.getStringSerializer()
                            .serialize(RedisKeyConstants.seatLock(showtimeId, seatId));

                    byte[] seatBytes = redis.getStringSerializer().serialize(seatId);

                    connection.del(lockKeyBytes);
                    connection.sRem(setKeyBytes, seatBytes);
                    connection.hSet(hashKeyBytes, seatBytes, availableBytes);
                }

                return null;
            });

            log.info("Released {} seats for showtime {} without owner check", seatIds.size(), showtimeId);
            return;
        }

        List<String> keys = new ArrayList<>();

        for (String seatId : seatIds) {
            keys.add(RedisKeyConstants.seatLock(showtimeId, seatId));
        }

        String lua = """
        for i=1,#KEYS do
            local owner = redis.call('GET', KEYS[i])
            local seatId = ARGV[i + 1]

            if owner == ARGV[1] then
                redis.call('DEL', KEYS[i])
                redis.call('SREM', ARGV[2], seatId)
                redis.call('HSET', ARGV[3], seatId, ARGV[4])
            end
        end

        return 'OK'
        """;

        List<String> args = new ArrayList<>();
        args.add(userId);
        args.add(lockedSetKey);
        args.add(seatMapKey);
        args.add(SeatStatus.AVAILABLE.name());
        args.addAll(seatIds);

        redis.execute(
                new DefaultRedisScript<>(lua, Object.class),
                keys,
                args.toArray()
        );

        log.info("Released {} seats for showtime {} by user {}", seatIds.size(), showtimeId, userId);
    }

    public void markSeatsBooked(String showtimeId, List<String> seatIds, String userId) {
        if (seatIds == null || seatIds.isEmpty()) {
            return;
        }

        redis.executePipelined((RedisCallback<Object>) connection -> {
            byte[] setKey = redis.getStringSerializer()
                    .serialize(RedisKeyConstants.showtimeLocked(showtimeId));

            byte[] hashKey = redis.getStringSerializer()
                    .serialize(RedisKeyConstants.seatMap(showtimeId));

            byte[] booked = redis.getStringSerializer().serialize(SeatStatus.BOOKED.name());

            for (String seatId : seatIds) {
                byte[] lockKey = redis.getStringSerializer()
                        .serialize(RedisKeyConstants.seatLock(showtimeId, seatId));

                byte[] seat = redis.getStringSerializer().serialize(seatId);

                connection.del(lockKey);
                connection.sRem(setKey, seat);
                connection.hSet(hashKey, seat, booked);
            }

            return null;
        });

        if (userId != null) {
            redis.delete(RedisKeyConstants.bookingSession(userId, showtimeId));
        }

        log.info("Marked {} seats as BOOKED for showtime {}", seatIds.size(), showtimeId);
    }

    public boolean isLockedByUser(String showtimeId, String seatId, String userId) {
        String owner = redis.opsForValue().get(RedisKeyConstants.seatLock(showtimeId, seatId));
        return userId != null && userId.equals(owner);
    }

    public Set<String> getLockedSeatIds(String showtimeId) {
        Set<String> members = redis.opsForSet().members(RedisKeyConstants.showtimeLocked(showtimeId));
        return members != null ? members : Collections.emptySet();
    }

    public boolean extendLock(String showtimeId, List<String> seatIds, String userId) {
        for (String seatId : seatIds) {
            String key = RedisKeyConstants.seatLock(showtimeId, seatId);
            String owner = redis.opsForValue().get(key);

            if (!userId.equals(owner)) {
                return false;
            }

            redis.expire(key, Duration.ofSeconds(lockTtlSeconds));
        }

        return true;
    }

    public long getRemainingTtl(String showtimeId, String seatId) {
        Long ttl = redis.getExpire(RedisKeyConstants.seatLock(showtimeId, seatId));
        return ttl != null ? ttl : 0;
    }
}