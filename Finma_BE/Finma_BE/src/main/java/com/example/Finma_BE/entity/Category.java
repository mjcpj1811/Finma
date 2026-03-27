package com.example.Finma_BE.entity;

import com.example.Finma_BE.enums.CategoryType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "categories")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Category extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Enumerated(EnumType.STRING)
    private CategoryType type;

    private String icon;
    private String color;

    @Column(name = "is_default")
    private Boolean isDefault;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    // self reference
    @ManyToOne
    @JoinColumn(name = "parent_id")
    private Category parent;
}