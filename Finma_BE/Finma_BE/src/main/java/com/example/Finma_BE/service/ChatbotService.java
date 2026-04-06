package com.example.Finma_BE.service;

import com.example.Finma_BE.dto.request.ChatRequest;
import com.example.Finma_BE.dto.response.ChatResponse;
import com.example.Finma_BE.entity.*;
import com.example.Finma_BE.exception.AppException;
import com.example.Finma_BE.exception.ErrorCode;
import com.example.Finma_BE.service.debt.DebtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatbotService {

    private final ChatSessionService chatSessionService;
    private final ChatMessageService chatMessageService;
    private final GeminiService geminiService;
    private final AccountService accountService;
    private final BudgetService budgetService;
    private final GoalService goalService;
    private final DebtService debtService;
    private final TransactionService transactionService;
    private final UserService userService;

    public ChatResponse ask(ChatRequest request) {
//
//        // validate
//        if (request.getQuestion() == null || request.getQuestion().isBlank()) {
//            throw new AppException(ErrorCode.INVALID_REQUEST);
//        }
//
//        if (request.getSessionId() == null) {
//            throw new AppException(ErrorCode.INVALID_REQUEST);
//        }

        // get current user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User user = userService.findByUsername(email);

        // get session
        ChatSession session = chatSessionService.findChatSessionById(request.getSessionId());

        // check ownership
        if (!session.getUser().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
        }

        Long userId = user.getId();

        // save user message
        ChatMessage userMessage = new ChatMessage();
        userMessage.setSession(session);
        userMessage.setRole("user");
        userMessage.setContent(request.getQuestion());
        chatMessageService.saveChatMessage(userMessage);

        // get history
        int maxHistory = 6;
        List<ChatMessage> chatHistory = chatMessageService.getChatHistory(request.getSessionId());
        List<ChatMessage> recentHistory = chatHistory.size() > maxHistory
                ? chatHistory.subList(chatHistory.size() - maxHistory, chatHistory.size())
                : chatHistory;

        // build context
        String userContext = buildUserContext(userId);

        // call AI
        String answer = geminiService.callGemini(recentHistory, userContext);

        // save AI message
        ChatMessage aiMessage = new ChatMessage();
        aiMessage.setSession(session);
        aiMessage.setRole("assistant");
        aiMessage.setContent(answer);
        chatMessageService.saveChatMessage(aiMessage);

        return new ChatResponse(answer);
    }

    private String buildUserContext(Long userId) {
        StringBuilder context = new StringBuilder();

        List<Account> accounts = accountService.getAccountsByUserId(userId);
        if (!accounts.isEmpty()) {
            context.append("Tài khoản:\n");
            for (Account acc : accounts) {
                context.append("- ").append(acc.getName()).append(": ")
                        .append(acc.getBalance()).append(" VND\n");
            }
        }

        List<Transaction> transactions = transactionService.getRecentTransactionsByUserId(userId, 10);
        if (!transactions.isEmpty()) {
            context.append("\nGiao dịch gần đây:\n");
            for (Transaction t : transactions) {
                context.append("- ").append(": ")
                        .append(t.getAmount()).append(" VND (").append(t.getType()).append(")\n");
            }
        }

        List<Budget> budgets = budgetService.getBudgetsByUserId(userId);
        if (!budgets.isEmpty()) {
            context.append("\nNgân sách:\n");
            for (Budget b : budgets) {
                context.append("- ").append(b.getCategory().getName()).append(": ")
                        .append(b.getAmountLimit()).append(" VND\n");
            }
        }

        List<Goal> goals = goalService.getActiveGoalsByUserId(userId);
        if (!goals.isEmpty()) {
            context.append("\nMục tiêu:\n");
            for (Goal g : goals) {
                context.append("- ").append(g.getName()).append(": ")
                        .append(g.getTargetAmount());
            }
        }

        List<Debt> debts = debtService.getActiveDebtsByUserId(userId);
        if (!debts.isEmpty()) {
            context.append("\nNợ chưa trả:\n");
            for (Debt d : debts) {
                context.append("- ").append(": ")
                        .append(d.getTotalAmount()).append(" VND (lãi suất: ")
                        .append(d.getInterestRate()).append("%)\n");
            }
        }

        return context.toString();
    }
}