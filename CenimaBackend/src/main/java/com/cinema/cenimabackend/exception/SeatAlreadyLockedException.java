package com.cinema.cenimabackend.exception;
import org.springframework.http.HttpStatus;
public class SeatAlreadyLockedException extends BaseException {
    public SeatAlreadyLockedException(String message) {
        super(message, HttpStatus.CONFLICT);
    }
}

