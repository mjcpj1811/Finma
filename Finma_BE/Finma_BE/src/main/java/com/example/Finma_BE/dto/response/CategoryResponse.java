package com.example.Finma_BE.dto.response;

import com.example.Finma_BE.enums.CategoryType;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CategoryResponse {

    Long id;
    String name;
    CategoryType type;
    String icon;
    String color;
    Boolean isDefault;
    Long parentId;
    String parentName;
}
