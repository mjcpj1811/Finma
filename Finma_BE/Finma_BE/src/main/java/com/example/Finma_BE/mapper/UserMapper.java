package com.example.Finma_BE.mapper;
import com.example.Finma_BE.dto.request.UserCreationRequest;
import com.example.Finma_BE.dto.response.UserResponse;
import com.example.Finma_BE.entity.User;
import org.mapstruct.Mapper;


import java.util.List;
@Mapper(componentModel = "spring")
public interface UserMapper {
    User toUser(UserCreationRequest userCreationRequest);
    UserResponse toUserResponse(User user);
    List<UserResponse> toUserResponse(List<User> users);

}