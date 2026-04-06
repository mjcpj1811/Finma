package com.example.Finma_BE.mapper;

import com.example.Finma_BE.dto.request.debt.DebtCreateRequest;
import com.example.Finma_BE.dto.request.debt.DebtUpdateRequest;
import com.example.Finma_BE.dto.response.debt.DebtPaymentResponse;
import com.example.Finma_BE.dto.response.debt.DebtResponse;
import com.example.Finma_BE.dto.response.debt.DebtSumaryResponse;
import com.example.Finma_BE.entity.Debt;
import com.example.Finma_BE.entity.DebtPayment;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-04-02T07:22:26+0700",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 17.0.17 (Microsoft)"
)
@Component
public class DebtMapperImpl implements DebtMapper {

    @Override
    public DebtSumaryResponse toDebtSumaryResponse(Debt debt) {
        if ( debt == null ) {
            return null;
        }

        DebtSumaryResponse.DebtSumaryResponseBuilder debtSumaryResponse = DebtSumaryResponse.builder();

        debtSumaryResponse.id( debt.getId() );
        debtSumaryResponse.type( debt.getType() );
        debtSumaryResponse.personName( debt.getPersonName() );
        debtSumaryResponse.totalAmount( debt.getTotalAmount() );
        debtSumaryResponse.dueDate( debt.getDueDate() );
        debtSumaryResponse.status( debt.getStatus() );
        debtSumaryResponse.startDate( debt.getStartDate() );

        return debtSumaryResponse.build();
    }

    @Override
    public DebtResponse toDebtResponse(Debt debt) {
        if ( debt == null ) {
            return null;
        }

        DebtResponse.DebtResponseBuilder debtResponse = DebtResponse.builder();

        debtResponse.id( debt.getId() );
        debtResponse.type( debt.getType() );
        debtResponse.personName( debt.getPersonName() );
        debtResponse.totalAmount( debt.getTotalAmount() );
        debtResponse.interestRate( debt.getInterestRate() );
        debtResponse.startDate( debt.getStartDate() );
        debtResponse.dueDate( debt.getDueDate() );
        debtResponse.note( debt.getNote() );
        debtResponse.status( debt.getStatus() );
        debtResponse.payments( debtPaymentListToDebtPaymentResponseList( debt.getPayments() ) );
        debtResponse.createdAt( debt.getCreatedAt() );
        debtResponse.updatedAt( debt.getUpdatedAt() );

        return debtResponse.build();
    }

    @Override
    public Debt toDebt(DebtCreateRequest debtCreateRequest) {
        if ( debtCreateRequest == null ) {
            return null;
        }

        Debt.DebtBuilder debt = Debt.builder();

        debt.personName( debtCreateRequest.getPersonName() );
        debt.type( debtCreateRequest.getType() );
        debt.totalAmount( debtCreateRequest.getTotalAmount() );
        debt.interestRate( debtCreateRequest.getInterestRate() );
        debt.startDate( debtCreateRequest.getStartDate() );
        debt.dueDate( debtCreateRequest.getDueDate() );
        debt.note( debtCreateRequest.getNote() );

        return debt.build();
    }

    @Override
    public void updateDebt(Debt debt, DebtUpdateRequest debtUpdateRequest) {
        if ( debtUpdateRequest == null ) {
            return;
        }

        if ( debtUpdateRequest.getPersonName() != null ) {
            debt.setPersonName( debtUpdateRequest.getPersonName() );
        }
        if ( debtUpdateRequest.getType() != null ) {
            debt.setType( debtUpdateRequest.getType() );
        }
        if ( debtUpdateRequest.getTotalAmount() != null ) {
            debt.setTotalAmount( debtUpdateRequest.getTotalAmount() );
        }
        if ( debtUpdateRequest.getInterestRate() != null ) {
            debt.setInterestRate( debtUpdateRequest.getInterestRate() );
        }
        if ( debtUpdateRequest.getStartDate() != null ) {
            debt.setStartDate( debtUpdateRequest.getStartDate() );
        }
        if ( debtUpdateRequest.getDueDate() != null ) {
            debt.setDueDate( debtUpdateRequest.getDueDate() );
        }
        if ( debtUpdateRequest.getNote() != null ) {
            debt.setNote( debtUpdateRequest.getNote() );
        }
    }

    protected DebtPaymentResponse debtPaymentToDebtPaymentResponse(DebtPayment debtPayment) {
        if ( debtPayment == null ) {
            return null;
        }

        DebtPaymentResponse.DebtPaymentResponseBuilder debtPaymentResponse = DebtPaymentResponse.builder();

        debtPaymentResponse.id( debtPayment.getId() );
        debtPaymentResponse.amount( debtPayment.getAmount() );
        debtPaymentResponse.paymentDate( debtPayment.getPaymentDate() );
        debtPaymentResponse.createdAt( debtPayment.getCreatedAt() );
        debtPaymentResponse.updatedAt( debtPayment.getUpdatedAt() );

        return debtPaymentResponse.build();
    }

    protected List<DebtPaymentResponse> debtPaymentListToDebtPaymentResponseList(List<DebtPayment> list) {
        if ( list == null ) {
            return null;
        }

        List<DebtPaymentResponse> list1 = new ArrayList<DebtPaymentResponse>( list.size() );
        for ( DebtPayment debtPayment : list ) {
            list1.add( debtPaymentToDebtPaymentResponse( debtPayment ) );
        }

        return list1;
    }
}
