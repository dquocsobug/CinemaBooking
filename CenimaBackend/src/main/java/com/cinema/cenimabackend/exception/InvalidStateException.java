package com.cinema.cenimabackend.exception;
import org.springframework.http.HttpStatus;
public class InvalidStateException extends BaseException {
    public InvalidStateException(String message) {
        super(message, HttpStatus.UNPROCESSABLE_ENTITY);
    }
}
