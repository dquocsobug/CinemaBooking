package com.cinema.cenimabackend.websocket;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class SeatWebSocketPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    private static final String SEAT_TOPIC = "/topic/showtime/";

    public void publishSeatLocked(String showtimeId, String seatId, String seatCode) {

        SeatEvent event = SeatEvent.builder()
                .type("SEAT_LOCKED")
                .showtimeId(showtimeId)
                .seatId(seatId)
                .seatCode(seatCode)
                .status("LOCKED")
                .build();

        send(showtimeId, event);
    }

    public void publishSeatReleased(String showtimeId, String seatId) {

        SeatEvent event = SeatEvent.builder()
                .type("SEAT_RELEASED")
                .showtimeId(showtimeId)
                .seatId(seatId)
                .status("AVAILABLE")
                .build();

        send(showtimeId, event);
    }

    public void publishSeatBooked(String showtimeId, String seatId, String seatCode) {

        SeatEvent event = SeatEvent.builder()
                .type("SEAT_BOOKED")
                .showtimeId(showtimeId)
                .seatId(seatId)
                .seatCode(seatCode)
                .status("BOOKED")
                .build();

        send(showtimeId, event);
    }

    private void send(String showtimeId, SeatEvent event) {

        String destination = SEAT_TOPIC + showtimeId;

        messagingTemplate.convertAndSend(destination, event);

        log.debug("WebSocket published {} to {}", event.getType(), destination);
    }
}