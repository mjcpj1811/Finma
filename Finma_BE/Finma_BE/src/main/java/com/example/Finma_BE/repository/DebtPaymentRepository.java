package com.example.Finma_BE.repository;

import com.example.Finma_BE.entity.DebtPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface DebtPaymentRepository extends JpaRepository<DebtPayment,Long> {
    List<DebtPayment> findByDebtIdOrderByPaymentDateDesc(Long debtId);

    Optional<DebtPayment> findByIdAndDebtId(Long id, Long debtId);

    // Tổng đã thanh toán của 1 khoản nợ
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM DebtPayment p WHERE p.debt.id = :debtId")
    BigDecimal sumPaidByDebtId(@Param("debtId") Long debtId);

    List<DebtPayment> findByDebtId(Long debtId);
}
