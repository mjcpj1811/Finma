package com.example.Finma_BE.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;


@Getter
public enum ErrorCode {
    INVALID_KEY(1001, "Invalid key", HttpStatus.BAD_REQUEST),
    USER_ALREADY_EXISTS(1002, "User already exists", HttpStatus.BAD_REQUEST),
    PASSWORD_INVALID(1003, "Password must be at least 8 characters long", HttpStatus.BAD_REQUEST),
    USER_NOT_FOUND(1004, "User not found", HttpStatus.NOT_FOUND),
    USER_NOT_EXIST(1005, "User does not exist", HttpStatus.NOT_FOUND),
    UNAUTHENTICATED_ACCESS(1006, "Unauthenticated access", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED_ACCESS(1007, "Unauthorized access", HttpStatus.FORBIDDEN),
    CATEGORY_NOT_FOUND(1008, "Category not found", HttpStatus.NOT_FOUND),
    BUDGET_NOT_FOUND(1009, "Budget not found", HttpStatus.NOT_FOUND),
    BUDGET_ALREADY_EXISTS(1010, "Budget already exists for this category in the given period", HttpStatus.CONFLICT),
    BUDGET_UNAUTHORIZED(1011, "You are not authorized to access this budget", HttpStatus.FORBIDDEN),
    GOAL_NOT_FOUND(1012, "Goal not found", HttpStatus.NOT_FOUND),
    GOAL_UNAUTHORIZED(1013, "You are not authorized to access this goal", HttpStatus.FORBIDDEN),
    GOAL_ALREADY_COMPLETED(1014, "Goal is already completed or cancelled", HttpStatus.BAD_REQUEST),
    GOAL_DEPOSIT_NOT_FOUND(1015, "Goal deposit not found", HttpStatus.NOT_FOUND),
    GOAL_DEPOSIT_EXCEEDS_TARGET(1016, "Deposit amount exceeds remaining target amount", HttpStatus.BAD_REQUEST),
    NOTIFICATION_NOT_FOUND(1017, "Notification not found", HttpStatus.NOT_FOUND),
    UNCATEGORIZED_EXCEPTION(9999, "An uncategorized exception occurred", HttpStatus.INTERNAL_SERVER_ERROR);

    private final int code;
    private final String message;
    private HttpStatusCode httpStatusCode;

    ErrorCode(int code, String message, HttpStatusCode httpStatusCode) {
        this.code = code;
        this.message = message;
        this.httpStatusCode = httpStatusCode;
    }
}