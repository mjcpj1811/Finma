package com.example.Finma_BE.util;

import com.example.Finma_BE.exception.AppException;
import com.example.Finma_BE.exception.ErrorCode;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class SecurityUtils {

    public static Long getCurrentUserId() {

        var authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()) {

            throw new AppException(
                    ErrorCode.UNAUTHENTICATED_ACCESS
            );
        }

        return Long.parseLong(authentication.getName());
    }
}