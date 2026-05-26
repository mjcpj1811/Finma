package com.example.Finma_BE.mapper;

import com.example.Finma_BE.dto.request.debt.DebtPaymentCreateRequest;
import com.example.Finma_BE.dto.request.debt.DebtPaymentUpdateRequest;
import com.example.Finma_BE.dto.response.debt.DebtPaymentResponse;
import com.example.Finma_BE.entity.DebtPayment;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-05-23T14:11:44+0700",
    comments = "version: 1.6.3, compiler: javac, environment: Java 17.0.17 (Microsoft)"
)
@Component
public class DebtPaymentMapperImpl implements DebtPaymentMapper {

    @Override
    public List<DebtPaymentResponse> toDebtPaymentResponseList(List<DebtPayment> debtPayments) {
        if ( debtPayments == null ) {
            return null;
        }

        List<DebtPaymentResponse> list = new ArrayList<DebtPaymentResponse>( debtPayments.size() );
        for ( DebtPayment debtPayment : debtPayments ) {
            list.add( toDebtPaymentResponse( debtPayment ) );
        }

        return list;
    }

    @Override
    public DebtPayment toDebtPayment(DebtPaymentCreateRequest debtPaymentCreateRequest) {
        if ( debtPaymentCreateRequest == null ) {
            return null;
        }

        DebtPayment.DebtPaymentBuilder debtPayment = DebtPayment.builder();

        debtPayment.amount( debtPaymentCreateRequest.getAmount() );
        debtPayment.paymentDate( debtPaymentCreateRequest.getPaymentDate() );
        debtPayment.title( debtPaymentCreateRequest.getTitle() );
        debtPayment.counterparty( debtPaymentCreateRequest.getCounterparty() );

        return debtPayment.build();
    }

    @Override
    public DebtPaymentResponse toDebtPaymentResponse(DebtPayment debtPayment) {
        if ( debtPayment == null ) {
            return null;
        }

        DebtPaymentResponse.DebtPaymentResponseBuilder debtPaymentResponse = DebtPaymentResponse.builder();

        debtPaymentResponse.id( debtPayment.getId() );
        debtPaymentResponse.amount( debtPayment.getAmount() );
        debtPaymentResponse.paymentDate( debtPayment.getPaymentDate() );
        debtPaymentResponse.title( debtPayment.getTitle() );
        debtPaymentResponse.counterparty( debtPayment.getCounterparty() );
        debtPaymentResponse.createdAt( debtPayment.getCreatedAt() );
        debtPaymentResponse.updatedAt( debtPayment.getUpdatedAt() );

        return debtPaymentResponse.build();
    }

    @Override
    public void updateDebtPayment(DebtPayment debtPayment, DebtPaymentUpdateRequest debtPaymentUpdateRequest) {
        if ( debtPaymentUpdateRequest == null ) {
            return;
        }

        if ( debtPaymentUpdateRequest.getAmount() != null ) {
            debtPayment.setAmount( debtPaymentUpdateRequest.getAmount() );
        }
        if ( debtPaymentUpdateRequest.getPaymentDate() != null ) {
            debtPayment.setPaymentDate( debtPaymentUpdateRequest.getPaymentDate() );
        }
        if ( debtPaymentUpdateRequest.getTitle() != null ) {
            debtPayment.setTitle( debtPaymentUpdateRequest.getTitle() );
        }
        if ( debtPaymentUpdateRequest.getCounterparty() != null ) {
            debtPayment.setCounterparty( debtPaymentUpdateRequest.getCounterparty() );
        }
    }
}
