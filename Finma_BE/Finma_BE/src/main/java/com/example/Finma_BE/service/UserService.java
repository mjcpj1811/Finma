package com.example.Finma_BE.service;

import com.example.Finma_BE.dto.request.UserCreationRequest;
import com.example.Finma_BE.dto.response.UserResponse;
import com.example.Finma_BE.entity.User;
import com.example.Finma_BE.exception.AppException;
import com.example.Finma_BE.exception.ErrorCode;
import com.example.Finma_BE.mapper.UserMapper;
import com.example.Finma_BE.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class UserService {
    UserRepository userRepository;
    UserMapper userMapper;
    PasswordEncoder passwordEncoder;
    public UserResponse createUser(UserCreationRequest request) {

        if(userRepository.existsByUsername(request.getUsername())){
            throw new AppException(ErrorCode.USER_ALREADY_EXISTS);
        }
        User user=userMapper.toUser(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        return userMapper.toUserResponse(userRepository.save(user));
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

//    public UserResponse updateUser(String userId, UserUpdateRequest request){
//        User user = userRepository.findById(userId)
//                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
//        userMapper.updateUser(user, request);
//        user.setPassword(passwordEncoder.encode(request.getPassword()));
//        var roles = roleRepository.findAllById(request.getRoles());
//        user.setRoles(new HashSet<>(roles));
//        return userMapper.toUserResponse(userRepository.save(user));
//    }

    public boolean deleteUser(String username) {
        try {
            userRepository.deleteByUsername(username);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
