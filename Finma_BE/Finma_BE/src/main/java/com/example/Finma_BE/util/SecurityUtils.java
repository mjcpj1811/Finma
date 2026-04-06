package com.example.Finma_BE.util;

import com.example.Finma_BE.entity.User;
import com.example.Finma_BE.exception.AppException;
import com.example.Finma_BE.exception.ErrorCode;
import com.example.Finma_BE.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

@Component
public class SecurityUtils {

    private static UserRepository staticUserRepository;

    public SecurityUtils(UserRepository userRepository) {
        SecurityUtils.staticUserRepository = userRepository;
    }

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

        Object principal = authentication.getPrincipal();
        if (principal instanceof Jwt jwt) {
            Object uidClaim = jwt.getClaims().get("uid");
            if (uidClaim instanceof Number number) {
                return number.longValue();
            }
            if (uidClaim instanceof String uidString) {
                try {
                    return Long.parseLong(uidString);
                } catch (NumberFormatException ignored) {
                }
            }
        }

        try {
            return Long.parseLong(authentication.getName());
        } catch (NumberFormatException ex) {
            String principalName = authentication.getName();
            if (staticUserRepository != null && principalName != null && !principalName.isBlank()) {
                User user = staticUserRepository.findByUsername(principalName)
                        .or(() -> staticUserRepository.findByEmail(principalName))
                        .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED_ACCESS));
                return user.getId();
            }
            throw new AppException(ErrorCode.UNAUTHENTICATED_ACCESS);
        }
    }
}