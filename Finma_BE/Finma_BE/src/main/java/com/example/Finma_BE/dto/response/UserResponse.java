package com.example.Finma_BE.dto.response;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.util.Set;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE )
public class UserResponse {
    Long id;
    String username;
    String fullName;
    String email;
    String phone;
    LocalDate dob;
}