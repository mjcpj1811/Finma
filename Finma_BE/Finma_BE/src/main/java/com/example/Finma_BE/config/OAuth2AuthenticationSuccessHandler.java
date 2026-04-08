package com.example.Finma_BE.config;

import com.example.Finma_BE.dto.request.ApiResponse;
import com.example.Finma_BE.dto.response.AuthenticationResponse;
import com.example.Finma_BE.entity.User;
import com.example.Finma_BE.service.AuthenticationService;
import com.example.Finma_BE.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Lazy
public class OAuth2AuthenticationSuccessHandler implements AuthenticationSuccessHandler {
    UserService userService;
    AuthenticationService authenticationService;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        OAuth2User oauth2User = oauthToken.getPrincipal();
        String registrationId = oauthToken.getAuthorizedClientRegistrationId();
        OAuth2UserInfo userInfo = extractUserInfo(registrationId, oauth2User.getAttributes());

        User user = userService.processOAuth2User(userInfo.email(), userInfo.name(), userInfo.imageUrl());
        AuthenticationResponse authResponse = authenticationService.createAuthenticationResponse(user);
        
        // Chuyển hướng user về FE
        String targetUrl = "http://localhost:8081/oauth-callback?token=" + authResponse.getToken();
        
        response.sendRedirect(targetUrl);
    }

    private OAuth2UserInfo extractUserInfo(String registrationId, Map<String, Object> attributes) {
        String email = null;
        String name = null;
        String imageUrl = null;

        if ("google".equalsIgnoreCase(registrationId)) {
            email = (String) attributes.get("email");
            name = (String) attributes.get("name");
            imageUrl = (String) attributes.get("picture");
        } else if ("facebook".equalsIgnoreCase(registrationId)) {
            email = (String) attributes.get("email");
            name = (String) attributes.get("name");
            Object pictureObj = attributes.get("picture");
            if (pictureObj instanceof Map<?, ?> pictureMap) {
                Object dataObj = pictureMap.get("data");
                if (dataObj instanceof Map<?, ?> dataMap) {
                    imageUrl = (String) dataMap.get("url");
                }
            }
        } else {
            email = (String) attributes.get("email");
            name = (String) attributes.get("name");
            imageUrl = (String) attributes.get("picture");
        }

        return new OAuth2UserInfo(email, name, imageUrl);
    }

    private record OAuth2UserInfo(String email, String name, String imageUrl) {
    }
}
