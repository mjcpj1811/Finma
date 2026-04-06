package com.example.Finma_BE.dto.response.category;

import com.example.Finma_BE.enums.CategoryType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE )
public class CategoryResponse {
    Long id;
    String name;
    CategoryType type;
    String icon;
    String color;
    Boolean isDefault;

    /** Thông tin danh mục cha (nếu có) */
    ParentInfo parent;

    /** Danh sách danh mục con trực tiếp */
    List<CategoryResponse> children;

    LocalDateTime createdAt;
    LocalDateTime updatedAt;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE )
    public static class ParentInfo {
        Long id;
        String name;
        String icon;
        String color;
    }
}
