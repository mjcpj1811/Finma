package com.example.Finma_BE.mapper;

import com.example.Finma_BE.dto.request.recurringTransaction.RecurringTransactionCreateRequest;
import com.example.Finma_BE.dto.request.recurringTransaction.RecurringTransactionUpdateRequest;
import com.example.Finma_BE.dto.response.recurringTransaction.RecurringTransactionResponse;
import com.example.Finma_BE.dto.response.recurringTransaction.RecurringTransactionSummaryResponse;
import com.example.Finma_BE.entity.RecurringTransaction;
import com.example.Finma_BE.enums.Frequency;
import org.mapstruct.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Mapper cho giao dich dinh ky.
 */
@Mapper(componentModel = "spring"
        , nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface RecurringTransactionMapper {
        /**
         * Map entity sang response chi tiet.
         */
        @Mapping(target = "frequencyLabel", expression = "java(toFrequencyLabel(recurringTransaction.getFrequency()))")
        @Mapping(target = "executionLabel", expression = "java(toExecutionLabel(recurringTransaction))")
        @Mapping(target = "accountId", source = "account.id")
        @Mapping(target = "accountName", source = "account.name")
        @Mapping(target = "categoryId", source = "category.id")
        @Mapping(target = "categoryName", source = "category.name")
        @Mapping(target = "categoryIcon", source = "category.icon")
        @Mapping(target = "categoryColor", source = "category.color")
    RecurringTransactionResponse toResponse(RecurringTransaction recurringTransaction);

        /**
         * Map entity sang response tong quan.
         */
        @Mapping(target = "frequencyLabel", expression = "java(toFrequencyLabel(recurringTransaction.getFrequency()))")
        @Mapping(target = "executionLabel", expression = "java(toExecutionLabel(recurringTransaction))")
        @Mapping(target = "categoryIcon", source = "category.icon")
        @Mapping(target = "categoryColor", source = "category.color")
        RecurringTransactionSummaryResponse toSummary(RecurringTransaction recurringTransaction);

        /**
         * Map danh sach entity sang danh sach response tong quan.
         */
        List<RecurringTransactionSummaryResponse> toSummaryList(List<RecurringTransaction> list);

    /**
     * Map request tao moi sang entity.
     */
    @Mapping(
            target = "reminderDaysBefore",
            defaultValue = "1"
    )
    RecurringTransaction toRecurringTransaction(
            RecurringTransactionCreateRequest recurringTransactionCreateRequest);

        /**
         * Cap nhat entity tu request (bo qua cac field quan tri).
         */
        @Mapping(target = "id", ignore = true)
    @Mapping(target = "account", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "isActive", ignore = true)
    void updateRecurringTransaction(@MappingTarget RecurringTransaction recurringTransaction
            , RecurringTransactionUpdateRequest recurringTransactionUpdateRequest);

        /**
         * Doi tan suat sang nhan hien thi.
         */
        default String toFrequencyLabel(Frequency frequency) {
                if (frequency == null) {
                        return null;
                }
                return switch (frequency) {
                        case DAILY -> "Hàng ngày";
                        case WEEKLY -> "Hàng tuần";
                        case MONTHLY -> "Hàng tháng";
                        case YEARLY -> "Hàng năm";
                };
        }

        /**
         * Tao nhan mo ta ngay thuc thi tu thong tin giao dich dinh ky.
         */
        default String toExecutionLabel(RecurringTransaction recurringTransaction) {
                if (recurringTransaction == null || recurringTransaction.getFrequency() == null) {
                        return null;
                }

                return switch (recurringTransaction.getFrequency()) {
                        case DAILY -> "Mỗi ngày";
                        case WEEKLY -> {
                                String weekDay = toWeekdayLabel(recurringTransaction.getDayOfWeek());
                                yield weekDay != null ? "Vào " + weekDay : null;
                        }
                        case MONTHLY -> {
                                Integer dayOfMonth = resolveDayOfMonth(recurringTransaction);
                                yield dayOfMonth != null ? "Ngày " + dayOfMonth + " hàng tháng" : null;
                        }
                        case YEARLY -> {
                                Integer dayOfMonth = resolveDayOfMonth(recurringTransaction);
                                LocalDate startDate = recurringTransaction.getStartDate();
                                Integer month = startDate != null ? startDate.getMonthValue() : null;
                                if (dayOfMonth == null || month == null) {
                                        yield null;
                                }
                                yield "Ngày " + dayOfMonth + " tháng " + month + " hàng năm";
                        }
                };
        }

        /**
         * Xac dinh ngay trong thang (uu tien dayOfMonth, fallback startDate).
         */
        default Integer resolveDayOfMonth(RecurringTransaction recurringTransaction) {
                if (recurringTransaction.getDayOfMonth() != null) {
                        return recurringTransaction.getDayOfMonth();
                }
                LocalDate startDate = recurringTransaction.getStartDate();
                return startDate != null ? startDate.getDayOfMonth() : null;
        }

        /**
         * Doi so thu trong tuan sang nhan hien thi.
         */
        default String toWeekdayLabel(Integer dayOfWeek) {
                if (dayOfWeek == null) {
                        return null;
                }
                return switch (dayOfWeek) {
                        case 0 -> "Chủ nhật";
                        case 1 -> "Thứ 2";
                        case 2 -> "Thứ 3";
                        case 3 -> "Thứ 4";
                        case 4 -> "Thứ 5";
                        case 5 -> "Thứ 6";
                        case 6 -> "Thứ 7";
                        default -> null;
                };
        }

}
