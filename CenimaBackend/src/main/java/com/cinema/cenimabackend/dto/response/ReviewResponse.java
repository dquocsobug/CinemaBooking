package com.cinema.cenimabackend.dto.response;

import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ReviewResponse {
    private UUID id;
    private UUID userId;
    private String userFullName;
    private String userAvatar;
    private UUID movieId;
    private Short rating;
    private String comment;
    private Boolean isSpoiler;
    private Instant createdAt;
}