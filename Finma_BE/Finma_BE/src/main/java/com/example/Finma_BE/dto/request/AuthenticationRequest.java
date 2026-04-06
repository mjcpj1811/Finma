package com.example.Finma_BE.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE )
public class AuthenticationRequest {
    @NotBlank
    @JsonAlias("usernameOrEmail")
    String username;

    @NotBlank
    String password;
}