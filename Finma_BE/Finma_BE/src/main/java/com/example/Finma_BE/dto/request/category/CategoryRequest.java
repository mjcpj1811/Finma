package com.example.Finma_BE.dto.request.category;

import com.example.Finma_BE.enums.CategoryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE )
public class CategoryRequest {

    @NotBlank(message = "Tên danh mục không được để trống")
    @Size(max = 100, message = "Tên danh mục tối đa 100 ký tự")
    String name;

    @NotNull(message = "Loại danh mục không được để trống")
    CategoryType type;

    Long parentId;

    @Size(max = 50)
    String icon;

    @Size(max = 20)
    String color;

}
