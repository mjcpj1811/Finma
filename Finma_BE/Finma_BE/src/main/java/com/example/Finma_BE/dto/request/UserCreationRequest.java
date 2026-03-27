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
@FieldDefaults(level = AccessLevel.PRIVATE )
public class UserCreationRequest {

    String fullName;
    String email;
    String phone;
    @Size(min=3 , message = "USERNAME_INVALID")
    String username;

    @Size(min=8, message="PASSWORD_INVALID")
    String password;

    @JsonFormat(pattern = "dd/MM/yyyy")
    LocalDate dob;

}