package com.example.Finma_BE.finance.controller;

import com.example.Finma_BE.dto.request.ApiResponse;
import com.example.Finma_BE.finance.dto.response.ReportChartResponse;
import com.example.Finma_BE.finance.dto.response.ReportPieItemResponse;
import com.example.Finma_BE.finance.dto.response.ReportSummaryResponse;
import com.example.Finma_BE.finance.service.AuthContext;
import com.example.Finma_BE.finance.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportController {
    private final AuthContext authContext;
    private final ReportService reportService;

    @GetMapping("/summary")
    public ApiResponse<ReportSummaryResponse> summary(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long accountId
    ) {
        var user = authContext.requireCurrentUser();
        var result = reportService.summary(user, from, to, categoryId, accountId);
        return ApiResponse.<ReportSummaryResponse>builder()
                .message("OK")
                .result(result)
                .build();
    }

    @GetMapping("/chart")
    public ApiResponse<ReportChartResponse> chart(
            @RequestParam(required = false) String view,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long accountId
    ) {
        var user = authContext.requireCurrentUser();
        var result = reportService.chart(user, view, from, to, categoryId, accountId);
        return ApiResponse.<ReportChartResponse>builder()
                .message("OK")
                .result(result)
                .build();
    }

    @GetMapping("/pie")
    public ApiResponse<List<ReportPieItemResponse>> pie(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long accountId
    ) {
        var user = authContext.requireCurrentUser();
        var result = reportService.pie(user, from, to, categoryId, accountId);
        return ApiResponse.<List<ReportPieItemResponse>>builder()
                .message("OK")
                .result(result)
                .build();
    }
}

