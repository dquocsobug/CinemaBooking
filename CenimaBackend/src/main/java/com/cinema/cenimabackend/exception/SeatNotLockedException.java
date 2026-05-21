package com.cinema.cenimabackend.exception;

import org.springframework.http.HttpStatus;
public class SeatNotLockedException extends BaseException {
    public SeatNotLockedException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}