package com.example.Finma_BE.service;

import com.example.Finma_BE.dto.request.ChangePasswordRequest;
import com.example.Finma_BE.dto.request.DeleteAccountRequest;
import com.example.Finma_BE.dto.request.ForgotPasswordRequest;
import com.example.Finma_BE.dto.request.ResetPasswordRequest;
import com.example.Finma_BE.dto.request.UserCreationRequest;
import com.example.Finma_BE.dto.request.UserUpdateRequest;
import com.example.Finma_BE.dto.response.UserResponse;
import com.example.Finma_BE.entity.PasswordResetToken;
import com.example.Finma_BE.entity.User;
import com.example.Finma_BE.exception.AppException;
import com.example.Finma_BE.exception.ErrorCode;
import com.example.Finma_BE.mapper.UserMapper;
import com.example.Finma_BE.repository.PasswordResetTokenRepository;
import com.example.Finma_BE.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;
import java.util.HashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Lazy
public class UserService {
    UserRepository userRepository;
    PasswordResetTokenRepository passwordResetTokenRepository;
    UserMapper userMapper;
    PasswordEncoder passwordEncoder;
    EmailService emailService;

    public UserResponse createUser(UserCreationRequest request) {

        if(userRepository.existsByUsername(request.getUsername())){
            throw new AppException(ErrorCode.USER_ALREADY_EXISTS);
        }
        // Đảm bảo email chưa được sử dụng do logic đăng nhập hỗ trợ findByEmail
        if(request.getEmail() != null && userRepository.existsByEmail(request.getEmail())){
            throw new AppException(ErrorCode.USER_ALREADY_EXISTS); // Bạn có thể tạo thêm ErrorCode.EMAIL_ALREADY_EXISTS
        }
        User user=userMapper.toUser(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        return userMapper.toUserResponse(userRepository.save(user));
    }

    public User processOAuth2User(String email, String fullName, String avatar) {
        if (email == null || email.isBlank()) {
            throw new AppException(ErrorCode.UNAUTHENTICATED_ACCESS);
        }

        var user = userRepository.findByEmail(email).orElseGet(() -> {
            String usernameBase = email.split("@", 2)[0].replaceAll("[^A-Za-z0-9]", "");
            if (usernameBase.isBlank()) {
                usernameBase = "user";
            }
            String username = usernameBase;
            int suffix = 1;
            while (userRepository.existsByUsername(username)) {
                username = usernameBase + suffix++;
            }
            User newUser = new User();
            newUser.setUsername(username);
            newUser.setEmail(email);
            newUser.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
            newUser.setFullName(fullName);
            newUser.setAvatar(avatar);
            newUser.setStatus(1);
            newUser.setCurrency("VND");
            newUser.setTimezone("Asia/Ho_Chi_Minh");
            return newUser;
        });
        user.setFullName(fullName);
        user.setAvatar(avatar);
        return userRepository.save(user);
    }

    public List<UserResponse> getUsers() {
        return userMapper.toUserResponse(userRepository.findAll());
    }


    public UserResponse getUser(Long id){
        return userMapper.toUserResponse(userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND)));
    }

    @PostAuthorize("returnObject.username == authentication.name")
    public UserResponse getMyInfo() {
        var context = SecurityContextHolder.getContext();
        String name = context.getAuthentication().getName();
        User user = userRepository.findByUsername(name).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));
        return userMapper.toUserResponse(user);
    }

    public UserResponse updateMyProfile(UserUpdateRequest request) {
        var context = SecurityContextHolder.getContext();
        String name = context.getAuthentication().getName();
        User user = userRepository.findByUsername(name).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));
        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        if (request.getAvatar() != null) {
            user.setAvatar(request.getAvatar());
        }
        if (request.getDob() != null) {
            user.setDob(request.getDob());
        }
        if (request.getJob() != null) {
            user.setJob(request.getJob());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if  (request.getEmail() != null) {
            user.setEmail(request.getEmail());
        }
        return userMapper.toUserResponse(userRepository.save(user));
    }

    public UserResponse changePassword(ChangePasswordRequest request) {
        var context = SecurityContextHolder.getContext();
        String name = context.getAuthentication().getName();
        User user = userRepository.findByUsername(name).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.INCORRECT_PASSWORD);
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        return userMapper.toUserResponse(userRepository.save(user));
    }

    public String requestPasswordReset(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));

        String token = UUID.randomUUID().toString();

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .id(token)
                .email(user.getEmail())
                .expiryTime(Date.from(Instant.now().plus(1, ChronoUnit.HOURS)))
                .build();

        passwordResetTokenRepository.save(resetToken);

        // Gửi email
        emailService.sendResetPasswordEmail(user.getEmail(), token);
        return token;
    }

    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findById(request.getToken())
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED_ACCESS));
        if (resetToken.getExpiryTime().before(new Date())) {
            passwordResetTokenRepository.delete(resetToken);
            throw new AppException(ErrorCode.UNAUTHENTICATED_ACCESS);
        }
        User user = userRepository.findByEmail(resetToken.getEmail()).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        passwordResetTokenRepository.delete(resetToken);
    }

//    public UserResponse updateUser(String userId, UserUpdateRequest request){
//        User user = userRepository.findById(userId)
//                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
//        userMapper.updateUser(user, request);
//        user.setPassword(passwordEncoder.encode(request.getPassword()));
//        var roles = roleRepository.findAllById(request.getRoles());
//        user.setRoles(new HashSet<>(roles));
//        return userMapper.toUserResponse(userRepository.save(user));
//    }

    public boolean deleteUser(String userId, DeleteAccountRequest request) {
        var context = SecurityContextHolder.getContext();
        String currentUsername = context.getAuthentication().getName();
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));

        if (!passwordEncoder.matches(request.getPassword(), currentUser.getPassword())) {
            throw new AppException(ErrorCode.INCORRECT_PASSWORD);
        }

        if (!currentUser.getId().toString().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHENTICATED_ACCESS);
        }

        try {
            userRepository.delete(currentUser);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));
    }

    public User findByUsername(String username) {
        return userRepository.findByUsername(username).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));
    }
}
