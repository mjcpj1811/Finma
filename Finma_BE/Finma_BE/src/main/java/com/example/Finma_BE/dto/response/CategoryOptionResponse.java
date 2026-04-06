package com.example.Finma_BE.dto.response;

import com.example.Finma_BE.enums.CategoryType;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CategoryOptionResponse {
    private Long id;
    private String name;
    private CategoryType type;
}
