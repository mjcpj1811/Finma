package com.example.Finma_BE.mapper;

import com.example.Finma_BE.dto.request.recurringTransaction.RecurringTransactionCreateRequest;
import com.example.Finma_BE.dto.request.recurringTransaction.RecurringTransactionUpdateRequest;
import com.example.Finma_BE.dto.response.recurringTransaction.RecurringTransactionResponse;
import com.example.Finma_BE.dto.response.recurringTransaction.RecurringTransactionSummaryResponse;
import com.example.Finma_BE.entity.RecurringTransaction;
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
public class RecurringTransactionMapperImpl implements RecurringTransactionMapper {

    @Override
    public RecurringTransactionResponse toResponse(RecurringTransaction recurringTransaction) {
        if ( recurringTransaction == null ) {
            return null;
        }

        RecurringTransactionResponse.RecurringTransactionResponseBuilder recurringTransactionResponse = RecurringTransactionResponse.builder();

        recurringTransactionResponse.id( recurringTransaction.getId() );
        recurringTransactionResponse.title( recurringTransaction.getTitle() );
        recurringTransactionResponse.amount( recurringTransaction.getAmount() );
        recurringTransactionResponse.frequency( recurringTransaction.getFrequency() );
        recurringTransactionResponse.startDate( recurringTransaction.getStartDate() );
        recurringTransactionResponse.dayOfMonth( recurringTransaction.getDayOfMonth() );
        recurringTransactionResponse.dayOfWeek( recurringTransaction.getDayOfWeek() );
        recurringTransactionResponse.reminderDaysBefore( recurringTransaction.getReminderDaysBefore() );
        recurringTransactionResponse.note( recurringTransaction.getNote() );
        recurringTransactionResponse.isActive( recurringTransaction.getIsActive() );
        recurringTransactionResponse.status( recurringTransaction.getStatus() );
        recurringTransactionResponse.createdAt( recurringTransaction.getCreatedAt() );
        recurringTransactionResponse.updatedAt( recurringTransaction.getUpdatedAt() );

        return recurringTransactionResponse.build();
    }

    @Override
    public List<RecurringTransactionSummaryResponse> toSummaryList(List<RecurringTransaction> list) {
        if ( list == null ) {
            return null;
        }

        List<RecurringTransactionSummaryResponse> list1 = new ArrayList<RecurringTransactionSummaryResponse>( list.size() );
        for ( RecurringTransaction recurringTransaction : list ) {
            list1.add( recurringTransactionToRecurringTransactionSummaryResponse( recurringTransaction ) );
        }

        return list1;
    }

    @Override
    public RecurringTransaction toRecurringTransaction(RecurringTransactionCreateRequest recurringTransactionCreateRequest) {
        if ( recurringTransactionCreateRequest == null ) {
            return null;
        }

        RecurringTransaction.RecurringTransactionBuilder recurringTransaction = RecurringTransaction.builder();

        if ( recurringTransactionCreateRequest.getReminderDaysBefore() != null ) {
            recurringTransaction.reminderDaysBefore( recurringTransactionCreateRequest.getReminderDaysBefore() );
        }
        else {
            recurringTransaction.reminderDaysBefore( 1 );
        }
        recurringTransaction.amount( recurringTransactionCreateRequest.getAmount() );
        recurringTransaction.title( recurringTransactionCreateRequest.getTitle() );
        recurringTransaction.note( recurringTransactionCreateRequest.getNote() );
        recurringTransaction.frequency( recurringTransactionCreateRequest.getFrequency() );
        recurringTransaction.dayOfMonth( recurringTransactionCreateRequest.getDayOfMonth() );
        recurringTransaction.dayOfWeek( recurringTransactionCreateRequest.getDayOfWeek() );
        recurringTransaction.startDate( recurringTransactionCreateRequest.getStartDate() );

        return recurringTransaction.build();
    }

    @Override
    public void updateRecurringTransaction(RecurringTransaction recurringTransaction, RecurringTransactionUpdateRequest recurringTransactionUpdateRequest) {
        if ( recurringTransactionUpdateRequest == null ) {
            return;
        }

        if ( recurringTransactionUpdateRequest.getAmount() != null ) {
            recurringTransaction.setAmount( recurringTransactionUpdateRequest.getAmount() );
        }
        if ( recurringTransactionUpdateRequest.getTitle() != null ) {
            recurringTransaction.setTitle( recurringTransactionUpdateRequest.getTitle() );
        }
        if ( recurringTransactionUpdateRequest.getNote() != null ) {
            recurringTransaction.setNote( recurringTransactionUpdateRequest.getNote() );
        }
        if ( recurringTransactionUpdateRequest.getFrequency() != null ) {
            recurringTransaction.setFrequency( recurringTransactionUpdateRequest.getFrequency() );
        }
        if ( recurringTransactionUpdateRequest.getDayOfMonth() != null ) {
            recurringTransaction.setDayOfMonth( recurringTransactionUpdateRequest.getDayOfMonth() );
        }
        if ( recurringTransactionUpdateRequest.getDayOfWeek() != null ) {
            recurringTransaction.setDayOfWeek( recurringTransactionUpdateRequest.getDayOfWeek() );
        }
        if ( recurringTransactionUpdateRequest.getStartDate() != null ) {
            recurringTransaction.setStartDate( recurringTransactionUpdateRequest.getStartDate() );
        }
        if ( recurringTransactionUpdateRequest.getReminderDaysBefore() != null ) {
            recurringTransaction.setReminderDaysBefore( recurringTransactionUpdateRequest.getReminderDaysBefore() );
        }
    }

    protected RecurringTransactionSummaryResponse recurringTransactionToRecurringTransactionSummaryResponse(RecurringTransaction recurringTransaction) {
        if ( recurringTransaction == null ) {
            return null;
        }

        RecurringTransactionSummaryResponse.RecurringTransactionSummaryResponseBuilder recurringTransactionSummaryResponse = RecurringTransactionSummaryResponse.builder();

        recurringTransactionSummaryResponse.id( recurringTransaction.getId() );
        recurringTransactionSummaryResponse.title( recurringTransaction.getTitle() );
        recurringTransactionSummaryResponse.amount( recurringTransaction.getAmount() );
        recurringTransactionSummaryResponse.isActive( recurringTransaction.getIsActive() );
        recurringTransactionSummaryResponse.status( recurringTransaction.getStatus() );

        return recurringTransactionSummaryResponse.build();
    }
}
