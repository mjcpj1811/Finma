package com.example.Finma_BE.service;

import com.example.Finma_BE.dto.request.AccountRequest;
import com.example.Finma_BE.dto.response.AccountResponse;
import com.example.Finma_BE.dto.response.AccountSummaryResponse;
import com.example.Finma_BE.dto.response.TransactionResponse;
import com.example.Finma_BE.entity.Account;
import com.example.Finma_BE.entity.Transaction;
import com.example.Finma_BE.entity.User;
import com.example.Finma_BE.exception.AppException;
import com.example.Finma_BE.exception.ErrorCode;
import com.example.Finma_BE.repository.AccountRepository;
import com.example.Finma_BE.repository.TransactionRepository;
import com.example.Finma_BE.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class AccountService {
    AccountRepository accountRepository;
    TransactionRepository transactionRepository;
    UserRepository userRepository;

    public List<Account> getAccountsByUserId(Long userId) {
        return accountRepository.findAllByUserId(userId);
    }

    public AccountResponse createAccount(AccountRequest request) {
        User user = getCurrentUser();
        Account account = Account.builder()
                .name(request.getName())
                .type(request.getType())
                .balance(request.getBalance())
                .icon(request.getIcon())
                .color(request.getColor())
                .user(user)
                .build();
        return toAccountResponse(accountRepository.save(account));
    }

    public AccountResponse updateAccount(Long accountId, AccountRequest request) {
        User user = getCurrentUser();
        Account account = accountRepository.findByIdAndUserId(accountId, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        account.setName(request.getName());
        account.setType(request.getType());
        account.setBalance(request.getBalance());
        account.setIcon(request.getIcon());
        account.setColor(request.getColor());
        return toAccountResponse(accountRepository.save(account));
    }

    public void deleteAccount(Long accountId) {
        User user = getCurrentUser();
        Account account = accountRepository.findByIdAndUserId(accountId, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        transactionRepository.deleteAllByAccountId(account.getId());
        accountRepository.delete(account);
    }

    public List<AccountResponse> getAccounts() {
        User user = getCurrentUser();
        return accountRepository.findAllByUserId(user.getId()).stream()
                .map(this::toAccountResponse)
                .collect(Collectors.toList());
    }

    public AccountResponse getAccount(Long accountId) {
        User user = getCurrentUser();
        Account account = accountRepository.findByIdAndUserId(accountId, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return toAccountResponse(account);
    }


    //chưa hiểu require, flow, nghiệp vụ đoạn này.
    public List<TransactionResponse> getAccountTransactions(Long accountId) {
        User user = getCurrentUser();
        accountRepository.findByIdAndUserId(accountId, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return transactionRepository.findAllByAccountIdAndUserIdOrderByTransactionDateDesc(accountId, user.getId()).stream()
                .map(this::toTransactionResponse)
                .collect(Collectors.toList());
    }

    public List<AccountSummaryResponse> getAccountSummaries() {
        User user = getCurrentUser();
        return accountRepository.findAllByUserId(user.getId()).stream()
                .map(account -> AccountSummaryResponse.builder()
                        .accountId(account.getId())
                        .name(account.getName())
                        .type(account.getType())
                        .balance(account.getBalance())
                        .build())
                .collect(Collectors.toList());
    }

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));
    }

    //chưa hiểu require, flow, nghiệp vụ đoạn này.

    private AccountResponse toAccountResponse(Account account) {
        return AccountResponse.builder()
                .id(account.getId())
                .name(account.getName())
                .type(account.getType())
                .balance(account.getBalance())
                .icon(account.getIcon())
                .color(account.getColor())
                .build();
    }

    //chưa hiểu require, flow, nghiệp vụ đoạn này.

    private TransactionResponse toTransactionResponse(Transaction transaction) {
        return TransactionResponse.builder()
                .id(transaction.getId())
                .type(transaction.getType())
                .amount(transaction.getAmount())
                .note(transaction.getNote())
                .imageUrl(transaction.getImageUrl())
                .location(transaction.getLocation())
                .transactionDate(transaction.getTransactionDate())
                .category(transaction.getCategory() != null ? transaction.getCategory().getName() : null)
                .build();
    }
}
