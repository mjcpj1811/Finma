package com.example.Finma_BE.mapper;

import com.example.Finma_BE.dto.request.category.CategoryRequest;
import com.example.Finma_BE.dto.response.category.CategoryResponse;
import com.example.Finma_BE.entity.Category;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-04-02T07:22:27+0700",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 17.0.17 (Microsoft)"
)
@Component
public class CategoryMapperImpl implements CategoryMapper {

    @Override
    public Category toCategory(CategoryRequest request) {
        if ( request == null ) {
            return null;
        }

        Category.CategoryBuilder category = Category.builder();

        category.name( request.getName() );
        category.type( request.getType() );
        category.icon( request.getIcon() );
        category.color( request.getColor() );

        category.isDefault( false );

        return category.build();
    }

    @Override
    public CategoryResponse toResponse(Category category) {
        if ( category == null ) {
            return null;
        }

        CategoryResponse.CategoryResponseBuilder categoryResponse = CategoryResponse.builder();

        categoryResponse.parent( CategoryMapper.toParentInfo( category.getParent() ) );
        categoryResponse.id( category.getId() );
        categoryResponse.name( category.getName() );
        categoryResponse.type( category.getType() );
        categoryResponse.icon( category.getIcon() );
        categoryResponse.color( category.getColor() );
        categoryResponse.isDefault( category.getIsDefault() );
        categoryResponse.createdAt( category.getCreatedAt() );
        categoryResponse.updatedAt( category.getUpdatedAt() );

        return categoryResponse.build();
    }

    @Override
    public void updateCategory(CategoryRequest request, Category category) {
        if ( request == null ) {
            return;
        }

        if ( request.getName() != null ) {
            category.setName( request.getName() );
        }
        if ( request.getType() != null ) {
            category.setType( request.getType() );
        }
        if ( request.getIcon() != null ) {
            category.setIcon( request.getIcon() );
        }
        if ( request.getColor() != null ) {
            category.setColor( request.getColor() );
        }
    }

    @Override
    public List<CategoryResponse> toResponseList(List<Category> categories) {
        if ( categories == null ) {
            return null;
        }

        List<CategoryResponse> list = new ArrayList<CategoryResponse>( categories.size() );
        for ( Category category : categories ) {
            list.add( toResponse( category ) );
        }

        return list;
    }
}
