package com.example.Finma_BE.controller.category;

import com.example.Finma_BE.dto.request.ApiResponse;
import com.example.Finma_BE.dto.request.category.CategoryRequest;
import com.example.Finma_BE.dto.response.category.CategoryResponse;
import com.example.Finma_BE.enums.CategoryType;
import com.example.Finma_BE.service.category.CategoryService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * API quan ly danh muc.
 */
@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/categories")
public class CategoryController {

    CategoryService categoryService;

    /**
     * Lay danh sach danh muc theo type neu co.
     */
    @GetMapping
    ApiResponse<List<CategoryResponse>> getCategories(
            @RequestParam(required = false) CategoryType type) {
        List<CategoryResponse> categories = categoryService.getCategoriesByUser(type);
        return ApiResponse.<List<CategoryResponse>>builder()
                .result(categories)
                .build();
    }

    /**
     * Lay chi tiet danh muc theo id.
     */
    @GetMapping("/{id}")
    ApiResponse<CategoryResponse> getCategoryById(@PathVariable Long id) {
        CategoryResponse categoryResponse = categoryService.getCategoryById(id);
        return ApiResponse.<CategoryResponse>builder()
                .result(categoryResponse)
                .build();
    }

    /**
     * Tao danh muc moi.
     */
    @PostMapping
    ApiResponse<CategoryResponse> createCategory(@RequestBody @Valid CategoryRequest categoryRequest){
        CategoryResponse categoryResponse = categoryService.createCategory(categoryRequest);
        return ApiResponse.<CategoryResponse>builder()
                .result(categoryResponse)
                .build();
    }

    /**
     * Cap nhat danh muc theo id.
     */
    @PutMapping("/{id}")
    ApiResponse<CategoryResponse> updateCategory(@PathVariable Long id
            , @RequestBody @Valid CategoryRequest categoryRequest){
        CategoryResponse categoryResponse = categoryService.updateCategory(id, categoryRequest);
        return  ApiResponse.<CategoryResponse>builder()
                .result(categoryResponse)
                .build();
    }

    /**
     * Xoa danh muc theo id.
     */
    @DeleteMapping("/{id}")
    ApiResponse<Void> deleteCategory(@PathVariable Long id){
        categoryService.deleteCategory(id);
        return ApiResponse.<Void>builder()
                .message("Category deleted successfully")
                .build();
    }
}
