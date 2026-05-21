package com.cinema.cenimabackend.exception;
import org.springframework.http.HttpStatus;
public class RateLimitException extends BaseException {
    public RateLimitException(String message) {
        super(message, HttpStatus.TOO_MANY_REQUESTS);
    }
}
