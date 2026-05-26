package com.example.Finma_BE.service;


import com.example.Finma_BE.dto.request.GoalDepositRequest;
import com.example.Finma_BE.dto.request.GoalRequest;
import com.example.Finma_BE.dto.response.GoalDepositResponse;
import com.example.Finma_BE.dto.response.GoalResponse;
import com.example.Finma_BE.entity.Account;
import com.example.Finma_BE.entity.Goal;
import com.example.Finma_BE.entity.Transaction;
import com.example.Finma_BE.entity.User;
import com.example.Finma_BE.enums.GoalStatus;
import com.example.Finma_BE.enums.NotificationType;
import com.example.Finma_BE.enums.TransactionType;
import com.example.Finma_BE.exception.AppException;
import com.example.Finma_BE.exception.ErrorCode;
import com.example.Finma_BE.repository.AccountRepository;
import com.example.Finma_BE.repository.GoalRepository;
import com.example.Finma_BE.repository.TransactionRepository;
import com.example.Finma_BE.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class GoalService {

    GoalRepository       goalRepository;
    TransactionRepository transactionRepository;
    AccountRepository    accountRepository;
    UserRepository       userRepository;
    NotificationService  notificationService;

    // ===================== HELPER =====================

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));
    }

    /**
     * Tính currentAmount live bằng query:
     *   SUM của tất cả Transaction có type=SAVING và goal=goalId
     */
    private BigDecimal queryCurrentAmount(Long goalId) {
        BigDecimal current = transactionRepository.sumSavingByGoalId(goalId);
        return current != null ? current : BigDecimal.ZERO;
    }

    /**
     * Map Goal → GoalResponse.
     * currentAmount được tính LIVE từ DB — không lưu trên Goal entity.
     */
    private GoalResponse mapToResponse(Goal goal) {
        BigDecimal target  = goal.getTargetAmount();
        BigDecimal current = queryCurrentAmount(goal.getId());
        BigDecimal remaining = target.subtract(current).max(BigDecimal.ZERO);

        // % tiến độ (0 – 100)
        double progress = 0.0;
        if (target.compareTo(BigDecimal.ZERO) > 0) {
            progress = current.divide(target, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue();
            progress = Math.min(progress, 100.0);
        }

        // Số ngày còn lại đến deadline
        LocalDate today = LocalDate.now();
        long daysRemaining = Math.max(ChronoUnit.DAYS.between(today, goal.getEndDate()), 0);

        // Số tiền cần tiết kiệm mỗi ngày / mỗi tháng
        BigDecimal dailyNeeded   = BigDecimal.ZERO;
        BigDecimal monthlyNeeded = BigDecimal.ZERO;
        if (daysRemaining > 0 && remaining.compareTo(BigDecimal.ZERO) > 0) {
            dailyNeeded   = remaining.divide(BigDecimal.valueOf(daysRemaining), 0, RoundingMode.CEILING);
            double monthsLeft = Math.max(daysRemaining / 30.0, 1.0);
            monthlyNeeded = remaining.divide(BigDecimal.valueOf(monthsLeft), 0, RoundingMode.CEILING);
        }

        return GoalResponse.builder()
                .id(goal.getId())
                .name(goal.getName())
                .description(goal.getDescription())
                .icon(goal.getIcon())
                .color(goal.getColor())
                .targetAmount(target)
                .currentAmount(current)
                .remainingAmount(remaining)
                .progressPercentage(Math.round(progress * 100.0) / 100.0)
                .status(goal.getStatus())
                .startDate(goal.getStartDate())
                .endDate(goal.getEndDate())
                .completedAt(goal.getCompletedAt())
                .daysRemaining(daysRemaining)
                .dailySavingNeeded(dailyNeeded)
                .monthlySavingNeeded(monthlyNeeded)
                .createdAt(goal.getCreatedAt())
                .updatedAt(goal.getUpdatedAt())
                .build();
    }

    /** Map Transaction(SAVING) → GoalDepositResponse */
    private GoalDepositResponse mapDepositResponse(Transaction t, BigDecimal currentAmount) {
        Goal goal   = t.getGoal();
        BigDecimal target = goal.getTargetAmount();

        double progress = 0.0;
        if (target.compareTo(BigDecimal.ZERO) > 0) {
            progress = currentAmount.divide(target, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue();
            progress = Math.min(progress, 100.0);
        }

        return GoalDepositResponse.builder()
                .id(t.getId())
                .goalId(goal.getId())
                .goalName(goal.getName())
                .amount(t.getAmount())
                .depositDate(t.getTransactionDate())
                .note(t.getNote())
                .goalCurrentAmount(currentAmount)
                .goalTargetAmount(target)
                .progressPercentage(Math.round(progress * 100.0) / 100.0)
                .createdAt(t.getCreatedAt())
                .build();
    }

    // ===================== GOAL CRUD =====================
 
    /**
     * Tạo mới một mục tiêu tiết kiệm (Goal).
     *
     * @param request thông tin chi tiết mục tiêu (tên, mô tả, số tiền đích, ngày bắt đầu, ngày kết thúc)
     * @return thông tin chi tiết mục tiêu vừa được tạo
     * @throws IllegalArgumentException nếu ngày kết thúc không sau ngày bắt đầu
     */
    @Transactional
    public GoalResponse createGoal(GoalRequest request) {
        User user = getCurrentUser();
 
        if (!request.getEndDate().isAfter(request.getStartDate())) {
            throw new IllegalArgumentException("End date must be after start date");
        }
 
        Goal goal = Goal.builder()
                .name(request.getName())
                .description(request.getDescription())
                .targetAmount(request.getTargetAmount())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .status(GoalStatus.IN_PROGRESS)
                .icon(request.getIcon())
                .color(request.getColor())
                .user(user)
                .build();
 
        Goal saved = goalRepository.save(goal);
        log.info("Created goal id={} '{}' for user={}", saved.getId(), saved.getName(), user.getUsername());
        return mapToResponse(saved);
    }
 
    /**
     * Lấy danh sách tất cả các mục tiêu tiết kiệm của người dùng hiện tại, sắp xếp theo thời gian tạo mới nhất.
     *
     * @return danh sách các mục tiêu tiết kiệm dưới dạng GoalResponse
     */
    public List<GoalResponse> getAllGoals() {
        User user = getCurrentUser();
        return goalRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }
 
    /**
     * Lọc danh sách mục tiêu tiết kiệm của người dùng hiện tại theo trạng thái cụ thể.
     *
     * @param status trạng thái cần lọc (IN_PROGRESS, COMPLETED, CANCELLED)
     * @return danh sách các mục tiêu thỏa mãn điều kiện
     */
    public List<GoalResponse> getGoalsByStatus(GoalStatus status) {
        User user = getCurrentUser();
        return goalRepository.findByUserIdAndStatusOrderByCreatedAtDesc(user.getId(), status)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }
 
    /**
     * Lấy thông tin chi tiết của một mục tiêu tiết kiệm cụ thể theo ID.
     *
     * @param goalId ID của mục tiêu tiết kiệm
     * @return thông tin chi tiết mục tiêu
     * @throws AppException nếu mục tiêu không tồn tại hoặc không thuộc quyền sở hữu của người dùng
     */
    public GoalResponse getGoal(Long goalId) {
        User user = getCurrentUser();
        Goal goal = goalRepository.findByIdAndUserId(goalId, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.GOAL_NOT_FOUND));
        return mapToResponse(goal);
    }
 
    /**
     * Cập nhật thông tin của mục tiêu tiết kiệm hiện tại.
     * Chỉ cho phép cập nhật khi mục tiêu đang trong trạng thái IN_PROGRESS.
     * Đồng thời không cho phép hạ số tiền mục tiêu thấp hơn số tiền thực tế đã tích lũy hiện tại.
     *
     * @param goalId ID của mục tiêu cần sửa đổi
     * @param request thông tin mới cần cập nhật
     * @return chi tiết mục tiêu sau khi cập nhật thành công
     * @throws AppException nếu mục tiêu đã hoàn thành/hủy bỏ, hoặc không tìm thấy mục tiêu
     * @throws IllegalArgumentException nếu ngày kết thúc không sau ngày bắt đầu, hoặc hạn mức đích nhỏ hơn số tiền tích lũy hiện tại
     */
    @Transactional
    public GoalResponse updateGoal(Long goalId, GoalRequest request) {
        User user = getCurrentUser();
        Goal goal = goalRepository.findByIdAndUserId(goalId, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.GOAL_NOT_FOUND));
 
        if (goal.getStatus() != GoalStatus.IN_PROGRESS) {
            throw new AppException(ErrorCode.GOAL_ALREADY_COMPLETED);
        }
        if (!request.getEndDate().isAfter(request.getStartDate())) {
            throw new IllegalArgumentException("End date must be after start date");
        }
 
        BigDecimal current = queryCurrentAmount(goalId);
        if (request.getTargetAmount().compareTo(current) < 0) {
            throw new IllegalArgumentException(
                    "New target amount cannot be less than current saved amount (" + current + ")");
        }
 
        goal.setName(request.getName());
        goal.setDescription(request.getDescription());
        goal.setTargetAmount(request.getTargetAmount());
        goal.setStartDate(request.getStartDate());
        goal.setEndDate(request.getEndDate());
        goal.setIcon(request.getIcon());
        goal.setColor(request.getColor());
 
        return mapToResponse(goalRepository.save(goal));
    }
 
    /**
     * Hủy thực hiện một mục tiêu tiết kiệm (chuyển trạng thái sang CANCELLED).
     *
     * @param goalId ID của mục tiêu cần hủy
     * @return chi tiết mục tiêu sau khi cập nhật trạng thái
     * @throws AppException nếu mục tiêu không tồn tại hoặc đã hoàn thành/hủy từ trước
     */
    @Transactional
    public GoalResponse cancelGoal(Long goalId) {
        User user = getCurrentUser();
        Goal goal = goalRepository.findByIdAndUserId(goalId, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.GOAL_NOT_FOUND));
 
        if (goal.getStatus() != GoalStatus.IN_PROGRESS) {
            throw new AppException(ErrorCode.GOAL_ALREADY_COMPLETED);
        }
 
        goal.setStatus(GoalStatus.CANCELLED);
        return mapToResponse(goalRepository.save(goal));
    }
 
    /**
     * Xóa hoàn toàn một mục tiêu tiết kiệm và toàn bộ lịch sử các lần nạp tiền tích lũy liên quan.
     *
     * @param goalId ID của mục tiêu tiết kiệm cần xóa
     * @throws AppException nếu không tìm thấy mục tiêu
     */
    @Transactional
    public void deleteGoal(Long goalId) {
        User user = getCurrentUser();
        Goal goal = goalRepository.findByIdAndUserId(goalId, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.GOAL_NOT_FOUND));
        
        // Xoá tất cả giao dịch liên quan đến goal này trước
        transactionRepository.deleteAllByGoalId(goalId);
        
        goalRepository.delete(goal);
        log.info("Deleted goal id={} for user={}", goalId, user.getUsername());
    }
 
    // ===================== DEPOSITS (via Transaction) =====================
 
    /**
     * Nạp tiền tích lũy vào mục tiêu tiết kiệm.
     * Sẽ tạo một giao dịch loại SAVING, trừ số dư tài khoản thanh toán được chọn (nếu có).
     * Sau khi lưu giao dịch, hệ thống tính toán lại tổng tiền tích lũy thực tế:
     * - Nếu tổng tích lũy đạt hoặc vượt số tiền đích của mục tiêu, trạng thái mục tiêu tự động
     *   chuyển thành COMPLETED, cập nhật ngày hoàn thành và gửi thông báo chúc mừng.
     * - Ngược lại, cập nhật thông tin và gửi thông báo nạp tiền thành công kèm tiến độ %.
     *
     * @param request thông tin chi tiết nạp tiền (ID mục tiêu, số tiền, tài khoản nguồn, ngày nạp, ghi chú)
     * @return chi tiết phản hồi giao dịch nạp tiền vừa tạo
     * @throws AppException nếu không tìm thấy mục tiêu hoặc mục tiêu đã hoàn thành từ trước
     */
    @Transactional
    public GoalDepositResponse addDeposit(GoalDepositRequest request) {
        User user = getCurrentUser();
        Goal goal = goalRepository.findByIdAndUserId(request.getGoalId(), user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.GOAL_NOT_FOUND));
 
        if (goal.getStatus() != GoalStatus.IN_PROGRESS) {
            throw new AppException(ErrorCode.GOAL_ALREADY_COMPLETED);
        }
 
        // Lấy account nếu có
        Account account = null;
        if (request.getAccountId() != null) {
            account = accountRepository.findById(request.getAccountId()).orElse(null);
        }
 
        LocalDateTime depositDateTime = request.getDepositDate() != null
                ? request.getDepositDate()
                : LocalDateTime.now();
 
        Transaction transaction = Transaction.builder()
                .type(TransactionType.SAVING)
                .amount(request.getAmount())
                .note(request.getNote())
                .transactionDate(depositDateTime)
                .user(user)
                .account(account)
                .goal(goal)
                .build();
 
        Transaction saved = transactionRepository.save(transaction);
 
        // Tính lại currentAmount từ DB sau khi lưu transaction mới
        BigDecimal newTotal = queryCurrentAmount(goal.getId());
 
        // Tự động chuyển COMPLETED nếu đạt target
        if (newTotal.compareTo(goal.getTargetAmount()) >= 0) {
            goal.setStatus(GoalStatus.COMPLETED);
            goal.setCompletedAt(LocalDate.now());
            goalRepository.save(goal);
            log.info("Goal id={} COMPLETED for user={}", goal.getId(), user.getUsername());
            notificationService.createNotification(
                    user,
                    NotificationType.GOAL_COMPLETED,
                    "🎉 Mục tiêu đã hoàn thành!",
                    String.format("Chúc mừng! Bạn đã hoàn thành mục tiêu '%s' với số tiền %s.",
                            goal.getName(), newTotal.toPlainString()),
                    goal.getId(), "GOAL"
            );
        } else {
            goalRepository.save(goal);
            notificationService.createNotification(
                    user,
                    NotificationType.GOAL_DEPOSIT_ADDED,
                    "💰 Nạp tiết kiệm thành công",
                    String.format("Bạn đã nạp %s vào mục tiêu '%s'. Tiến độ: %.1f%%.",
                            request.getAmount().toPlainString(),
                            goal.getName(),
                            newTotal.divide(goal.getTargetAmount(), 4, RoundingMode.HALF_UP)
                                    .multiply(BigDecimal.valueOf(100)).doubleValue()),
                    goal.getId(), "GOAL"
            );
        }
 
        log.info("Deposit amount={} → goal id={} for user={}", request.getAmount(), goal.getId(), user.getUsername());
        return mapDepositResponse(saved, newTotal);
    }
 
    /**
     * Lấy danh sách lịch sử nạp tiền (dưới dạng các giao dịch SAVING) của một mục tiêu cụ thể.
     * Để tránh lỗi truy vấn N+1, tổng số tích lũy được truy vấn trước một lần và truyền vào hàm map.
     *
     * @param goalId ID của mục tiêu tiết kiệm
     * @return danh sách chi tiết các lần nạp tiền tích lũy
     * @throws AppException nếu không tìm thấy mục tiêu
     */
    public List<GoalDepositResponse> getDeposits(Long goalId) {
        User user = getCurrentUser();
        goalRepository.findByIdAndUserId(goalId, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.GOAL_NOT_FOUND));
 
        // Tính currentAmount 1 lần cho tất cả deposits trong list (tránh N+1)
        BigDecimal currentAmount = queryCurrentAmount(goalId);
 
        return transactionRepository.findSavingsByGoalId(goalId)
                .stream()
                .map(t -> mapDepositResponse(t, currentAmount))
                .collect(Collectors.toList());
    }
 
    /**
     * Xóa (hoàn tác) một giao dịch nạp tiền tiết kiệm cụ thể theo ID giao dịch.
     * Hoàn trả lại số tiền về tài khoản nguồn. Tính toán lại tổng tiền tích lũy thực tế sau khi xóa.
     * Nếu mục tiêu trước đó đã hoàn thành (COMPLETED) nhưng do xóa giao dịch dẫn đến tổng tiền hụt dưới mức đích,
     * trạng thái mục tiêu sẽ tự động được chuyển ngược lại thành IN_PROGRESS và xóa ngày hoàn thành.
     *
     * @param transactionId ID của giao dịch nạp tiền cần xóa
     * @throws AppException nếu giao dịch nạp tiền không tồn tại hoặc không thuộc quyền sở hữu của người dùng
     */
    @Transactional
    public void deleteDeposit(Long transactionId) {
        User user = getCurrentUser();
        Transaction transaction = transactionRepository.findByIdAndUserId(transactionId, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.GOAL_DEPOSIT_NOT_FOUND));
 
        if (transaction.getType() != TransactionType.SAVING || transaction.getGoal() == null) {
            throw new AppException(ErrorCode.GOAL_DEPOSIT_NOT_FOUND);
        }
 
        Goal goal = transaction.getGoal();
        transactionRepository.delete(transaction);
        transactionRepository.flush();
 
        // Tính lại tổng sau khi xoá
        BigDecimal newTotal = queryCurrentAmount(goal.getId());
 
        // Nếu goal COMPLETED mà giờ chưa đủ → về IN_PROGRESS
        if (goal.getStatus() == GoalStatus.COMPLETED
                && newTotal.compareTo(goal.getTargetAmount()) < 0) {
            goal.setStatus(GoalStatus.IN_PROGRESS);
            goal.setCompletedAt(null);
            goalRepository.save(goal);
        }
 
        log.info("Deleted deposit id={} from goal id={} for user={}", transactionId, goal.getId(), user.getUsername());
    }
 
    /**
     * Lấy danh sách các mục tiêu tiết kiệm đang hoạt động (IN_PROGRESS) của người dùng.
     *
     * @param userId ID của người dùng
     * @return danh sách thực thể các mục tiêu đang hoạt động
     */
    public List<Goal> getActiveGoalsByUserId(Long userId) {
        return goalRepository.findAllByUserIdAndStatus(userId, GoalStatus.IN_PROGRESS);
    }
}





