package com.example.Finma_BE.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserUpdateRequest {
    String fullName;
    String avatar;
    @JsonFormat(pattern = "dd/MM/yyyy")
    LocalDate dob;
    String email;
    String job;
    String phone;
}
