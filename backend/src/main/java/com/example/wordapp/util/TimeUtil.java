package com.example.wordapp.util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

public final class TimeUtil {
    public static final ZoneId CHINA_ZONE = ZoneId.of("Asia/Shanghai");

    private TimeUtil() {
    }

    public static LocalDate nowDate() {
        return LocalDate.now(CHINA_ZONE);
    }

    public static LocalDateTime nowDateTime() {
        return LocalDateTime.now(CHINA_ZONE);
    }

    public static LocalDateTime startOfToday() {
        return nowDate().atStartOfDay();
    }

    public static LocalDateTime startOfTomorrow() {
        return nowDate().plusDays(1).atStartOfDay();
    }
}
