package com.example.Finma_BE.entity;

import com.example.Finma_BE.entity.Account;
import com.example.Finma_BE.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(unique = true)
    private String phone;

    @Column(nullable = false)
    private String password;

    @Column(name = "full_name")
    private String fullName;

    private String avatar;

    private LocalDate dob;

    private String job;

    private String currency = "VND";

    private String timezone = "Asia/Ho_Chi_Minh";

    private Integer status = 1;

    // RELATIONSHIPS
    @OneToMany(mappedBy = "user")
    private List<Account> accounts;

    @OneToMany(mappedBy = "user")
    private List<Category> categories;
}