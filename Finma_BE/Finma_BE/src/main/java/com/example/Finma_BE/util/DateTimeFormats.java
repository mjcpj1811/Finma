package com.example.Finma_BE.util;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

public final class DateTimeFormats {
    private DateTimeFormats() {}

    public static final ZoneId APP_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    public static final DateTimeFormatter API_DATE_TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    public static final DateTimeFormatter API_DATE = DateTimeFormatter.ofPattern("yyyy-MM-dd");
}
