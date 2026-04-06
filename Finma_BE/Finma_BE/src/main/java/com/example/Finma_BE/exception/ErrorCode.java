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
<<<<<<< HEAD
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
=======
    INCORRECT_PASSWORD(1008, "Incorrect password", HttpStatus.BAD_REQUEST),
    DEBT_NOT_FOUND(1008, "Debt not found", HttpStatus.NOT_FOUND),
    RETURN_DATE_MUST_BE_AFTER_START_DATE(1009, "Return Date must be after start date", HttpStatus.BAD_REQUEST),
    CANNOT_MARK_AS_PAID_WITH_REMAINING_AMOUNT(10010, "Cannot mark as Paid With Remaining Amount", HttpStatus.BAD_REQUEST),
    DEBT_ALREADY_PAID(10011, "Debt already paid", HttpStatus.BAD_REQUEST),
    PAYMENT_AMOUNT_EXCEEDS_REMAINING(10012, "Payment Amount Exceeds Remaining Amount", HttpStatus.BAD_REQUEST),
    PAYMENT_NOT_FOUND(10013, "Payment not found", HttpStatus.NOT_FOUND),
    CANNOT_REOPEN_PAID_DEBT(10014, "Cannot reopen paid debt", HttpStatus.BAD_REQUEST),
    INVALID_PAYMENT_AMOUNT(10015, "Invalid Payment Amount", HttpStatus.BAD_REQUEST),
    RECURRING_NOT_FOUND(10016, "Recurring Transaction not found", HttpStatus.NOT_FOUND),
    RECURRING_ALREADY_CANCELLED(10017, "Recurring Transaction cancelled", HttpStatus.BAD_REQUEST),
    INVALID_RECURRING_DAY_OF_WEEK(10018, "Invalid Recurring Day of Week", HttpStatus.BAD_REQUEST),
    INVALID_RECURRING_DAY_OF_MONTH(10019, "Invalid Recurring Day of Month", HttpStatus.BAD_REQUEST),
    ACCOUNT_NOT_FOUND(10020, "Account not found", HttpStatus.NOT_FOUND),
    CATEGORY_NOT_FOUND(10021, "Category not found", HttpStatus.NOT_FOUND),
    INVALID_FREQUENCY(10022, "Invalid Frequency", HttpStatus.BAD_REQUEST),
    INVALID_STATUS(10023, "Invalid Status", HttpStatus.BAD_REQUEST),
    CATEGORY_NAME_EXISTED(10024, "Category name already exists", HttpStatus.BAD_REQUEST),
    PARENT_CATEGORY_NOT_FOUND(10025, "Parent Category not found", HttpStatus.NOT_FOUND),
    CANNOT_MODIFY_DEFAULT_CATEGORY(10026, "Cannot modify default category", HttpStatus.BAD_REQUEST),
    CATEGORY_CIRCULAR_REFERENCE(10027, "Category circular reference", HttpStatus.BAD_REQUEST),
    CANNOT_DELETE_DEFAULT_CATEGORY(10028, "Cannot delete default category", HttpStatus.BAD_REQUEST),
    CATEGORY_HAS_TRANSACTIONS(10029, "Category has transactions", HttpStatus.BAD_REQUEST),
>>>>>>> deae13cc60cb03378d8e33da1fe49c684f8f51d5
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