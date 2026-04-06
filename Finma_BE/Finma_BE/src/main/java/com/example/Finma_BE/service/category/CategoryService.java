package com.example.Finma_BE.service.category;

import com.example.Finma_BE.dto.request.category.CategoryRequest;
import com.example.Finma_BE.dto.response.category.CategoryResponse;
import com.example.Finma_BE.entity.Category;
import com.example.Finma_BE.entity.User;
import com.example.Finma_BE.enums.CategoryType;
import com.example.Finma_BE.exception.AppException;
import com.example.Finma_BE.exception.ErrorCode;
import com.example.Finma_BE.mapper.CategoryMapper;
import com.example.Finma_BE.repository.CategoryRepository;
import com.example.Finma_BE.repository.UserRepository;
import com.example.Finma_BE.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class CategoryService {

    CategoryRepository categoryRepository;
    UserRepository userRepository;
    CategoryMapper categoryMapper;

    @Transactional(readOnly = true)
    public List<CategoryResponse> getCategoriesByUser(CategoryType type) {
        Long userId = SecurityUtils.getCurrentUserId();

        // Lấy các danh mục gốc (parent = null) theo user + type
        List<Category> roots = categoryRepository.findRootCategoriesByUser(userId, type);

        return roots.stream()
                .map(this::toResponseWithChildren)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(Long categoryId) {
        Long userId = SecurityUtils.getCurrentUserId();
        Category category = getCategoryOwnedByUser(categoryId, userId);
        return toResponseWithChildren(category);
    }

    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        User user = getUserById(userId);

        // Kiểm tra tên trùng trong cùng scope (user + type + parent)
        if (categoryRepository.existsByUserIdAndTypeAndNameAndParentId(
                userId, request.getType(), request.getName(), request.getParentId())) {
            throw new AppException(ErrorCode.CATEGORY_NAME_EXISTED);
        }

        Category parent = resolveParent(request.getParentId(), userId);

        Category category = categoryMapper.toCategory(request);
        category.setUser(user);
        category.setParent(parent);

        return categoryMapper.toResponse(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse updateCategory(Long categoryId, CategoryRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        Category category = getCategoryOwnedByUser(categoryId, userId);

        if (Boolean.TRUE.equals(category.getIsDefault())) {
            throw new AppException(ErrorCode.CANNOT_MODIFY_DEFAULT_CATEGORY);
        }

        // Kiểm tra tên trùng (loại trừ chính nó)
        boolean nameConflict = categoryRepository
                .existsByUserIdAndTypeAndNameAndParentId(
                        userId, request.getType(), request.getName(), request.getParentId())
                && !category.getName().equals(request.getName());
        if (nameConflict) {
            throw new AppException(ErrorCode.CATEGORY_NAME_EXISTED);
        }

        // Ngăn set parent là chính nó hoặc con của nó (tránh vòng lặp)
        if (request.getParentId() != null) {
            if (request.getParentId().equals(categoryId)) {
                throw new AppException(ErrorCode.CATEGORY_CIRCULAR_REFERENCE);
            }
            validateNotDescendant(categoryId, request.getParentId());
        }

        Category parent = resolveParent(request.getParentId(), userId);

        categoryMapper.updateCategory(request, category);
        category.setParent(parent);

        return toResponseWithChildren(categoryRepository.save(category));
    }

    @Transactional
    public void deleteCategory(Long categoryId) {
        Long userId = SecurityUtils.getCurrentUserId();
        Category category = getCategoryOwnedByUser(categoryId, userId);

        if (Boolean.TRUE.equals(category.getIsDefault())) {
            throw new AppException(ErrorCode.CANNOT_DELETE_DEFAULT_CATEGORY);
        }

        if (categoryRepository.hasTransactions(categoryId)) {
            throw new AppException(ErrorCode.CATEGORY_HAS_TRANSACTIONS);
        }

        categoryRepository.delete(category);
    }

    private Category getCategoryOwnedByUser(Long categoryId, Long userId) {
        return categoryRepository.findByIdAndUserId(categoryId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
    }


    private CategoryResponse toResponseWithChildren(Category category) {
        CategoryResponse response = categoryMapper.toResponse(category);

        List<Category> childEntities =
                categoryRepository.findByParentIdOrderByNameAsc(category.getId());

        List<CategoryResponse> childResponses = childEntities.stream()
                .map(this::toResponseWithChildren)
                .collect(Collectors.toList());

        response.setChildren(childResponses);
        return response;
    }

    private void validateNotDescendant(Long sourceId, Long targetParentId) {
        List<Category> children =
                categoryRepository.findByParentIdOrderByNameAsc(sourceId);
        for (Category child : children) {
            if (child.getId().equals(targetParentId)) {
                throw new AppException(ErrorCode.CATEGORY_CIRCULAR_REFERENCE);
            }
            validateNotDescendant(child.getId(), targetParentId);
        }
    }

    private Category resolveParent(Long parentId, Long userId) {
        if (parentId == null) return null;
        return categoryRepository.findByIdAndUserId(parentId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.PARENT_CATEGORY_NOT_FOUND));
    }

    private User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }
}
