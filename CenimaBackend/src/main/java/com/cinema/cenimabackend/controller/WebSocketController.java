package com.cinema.cenimabackend.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Slf4j
@Controller
@RequiredArgsConstructor
public class WebSocketController {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Client subscribe: /topic/showtime/{showtimeId}
     * Client send (optional ping): /app/showtime/{showtimeId}/ping
     */
    @MessageMapping("/showtime/{showtimeId}/ping")
    public void ping(@DestinationVariable String showtimeId, String userId) {
        log.debug("User {} is watching showtime {}", userId, showtimeId);
        // có thể track active viewers ở đây
    }
}