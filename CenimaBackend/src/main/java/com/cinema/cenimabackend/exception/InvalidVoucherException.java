package com.cinema.cenimabackend.exception;
import org.springframework.http.HttpStatus;
public class InvalidVoucherException extends BaseException {
    public InvalidVoucherException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}