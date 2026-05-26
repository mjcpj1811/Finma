package com.example.Finma_BE.mapper;

import com.example.Finma_BE.dto.request.category.CategoryRequest;
import com.example.Finma_BE.dto.response.category.CategoryResponse;
import com.example.Finma_BE.entity.Category;
import com.example.Finma_BE.entity.User;
import org.mapstruct.*;

import java.util.List;

/**
 * Mapper chuyen doi giua request/response va entity Category.
 */
@Mapper(componentModel = "spring"
    , nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface CategoryMapper {

    /**
     * Map request tao danh muc sang entity.
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "isDefault", constant = "false")
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "parent", ignore = true)
    Category toCategory(CategoryRequest request);

    /**
     * Map entity sang response (parent duoc rut gon, children nap sau).
     */
    @Mapping(target = "parent",   source = "parent",   qualifiedByName = "toParentInfo")
    @Mapping(target = "children", ignore = true)
    CategoryResponse toResponse(Category category);

    /**
     * Cap nhat entity tu request (bo qua cac field quan tri).
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "isDefault", ignore = true)
    @Mapping(target = "parent", ignore = true)
    void updateCategory(CategoryRequest request, @MappingTarget Category category);

    List<CategoryResponse> toResponseList(List<Category> categories);

    /**
     * Rut gon thong tin parent cho response.
     */
    @Named("toParentInfo")
    static CategoryResponse.ParentInfo toParentInfo(Category parent) {
        if (parent == null) return null;
        return CategoryResponse.ParentInfo.builder()
                .id(parent.getId())
                .name(parent.getName())
                .icon(parent.getIcon())
                .color(parent.getColor())
                .build();
    }
}
