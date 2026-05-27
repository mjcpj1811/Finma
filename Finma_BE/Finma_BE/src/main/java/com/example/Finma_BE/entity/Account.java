package com.example.Finma_BE.entity;

import com.example.Finma_BE.entity.BaseEntity;
import com.example.Finma_BE.enums.AccountType;
import jakarta.persistence.*;
import lombok.*;


import java.math.BigDecimal;

/**
 * Nguồn tiền thuộc sở hữu của một user.
 *
 * <p>Balance được thay đổi bởi các thao tác tạo/cập nhật/xóa giao dịch, vì vậy
 * service giao dịch phải kiểm tra quyền sở hữu trước khi cập nhật.</p>
 */
@Entity
@Table(name = "accounts")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Account extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Enumerated(EnumType.STRING)
    private AccountType type;

    private BigDecimal balance;

    private String icon;
    private String color;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
}
