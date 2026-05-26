# Báo cáo kỹ thuật dự án Finma

Ngày báo cáo: 23/05/2026
Phạm vi: Quản lý danh mục, quản lý vay nợ, quản lý định kỳ
Liên kết GitHub: https://github.com/mjcpj1811/Finma

---

## Phần 1: Tài liệu kỹ thuật mô tả chức năng

### 1.1 Mô tả chức năng

#### A. Quản lý danh mục
- Mục tiêu: Chuẩn hóa danh mục theo 3 nhóm UI (Tài chính, Chi tiêu, Thu nhập) và map trực tiếp sang `CategoryType` (FINANCE, EXPENSE, INCOME) để thống nhất nghiệp vụ giữa FE và BE.
- Cơ chế phân cấp: Hỗ trợ danh mục cha - con, dùng `parent_id` để tạo cây hiển thị, cho phép hiển thị nhóm chính và nhóm con trên giao diện.
- CRUD theo người dùng:
  - Tạo danh mục mới theo `type` và tùy chọn `parentId`.
  - Cập nhật danh mục không phải mặc định (`isDefault = false`).
  - Xóa danh mục không mặc định và chưa phát sinh giao dịch.
- Quy tắc nghiệp vụ:
  - Không cho phép trùng tên trong cùng phạm vi (user + type + parent).
  - Không cho phép thiết lập parent gây vòng lặp (parent là chính nó hoặc là con của nó).
  - Danh mục mặc định chỉ đọc (không sửa, không xóa).

#### B. Quản lý vay nợ
- Mục tiêu: Theo dõi các khoản vay/cho vay, tiến độ thanh toán và trạng thái khoản nợ.
- Phân loại: `DebtType` gồm `LEND` (cho vay) và `LOAN` (đi vay).
- CRUD khoản nợ:
  - Tạo/sửa/xóa khoản nợ theo user, trả về thông tin tổng hợp hoặc chi tiết.
  - Kiểm tra hợp lệ ngày bắt đầu và ngày đến hạn.
- Quản lý thanh toán (payments):
  - Tạo/cập nhật/xóa các đợt thanh toán theo từng khoản nợ.
  - Tự động cập nhật trạng thái `PAID`/`ONGOING` dựa trên tổng tiền đã thanh toán.
- Thống kê dashboard:
  - Tổng cho vay, tổng đang vay; đếm số khoản theo trạng thái.
- Quy tắc nghiệp vụ:
  - Số tiền thanh toán phải > 0 và không vượt số dư còn lại.
  - Không cho phép mở lại khoản nợ đã `PAID`.

#### C. Quản lý định kỳ
- Mục tiêu: Tự động hóa các giao dịch lặp theo chu kỳ (tiền phòng, lương, tiết kiệm...).
- Chu kỳ hỗ trợ: `Frequency` gồm `DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`.
- CRUD và toggle:
  - Tạo/sửa/xóa quy tắc định kỳ.
  - Bật/tắt quy tắc bằng `isActive` và cập nhật `RecurringStatus`.
- Thống kê:
  - Đếm số quy tắc đang hoạt động, tổng chi tiêu hàng tháng quy đổi.
- Scheduler:
  - Cron 00:05 hằng ngày tự tạo giao dịch đến hạn.
  - Sinh marker để tránh tạo trùng trong cùng ngày.
- Quy tắc nghiệp vụ:
  - `WEEKLY` bắt buộc `dayOfWeek` (0..6).
  - `MONTHLY`/`YEARLY` bắt buộc `dayOfMonth` (1..31).
  - `startDate` không được null và không cho chạy trước ngày bắt đầu.

### 1.2 Danh sách chức năng được phân công
- Quản lý danh mục: CRUD + phân cấp + ràng buộc tên/parent + danh mục mặc định.
- Quản lý vay nợ: CRUD khoản nợ, CRUD thanh toán, thống kê tổng và trạng thái.
- Quản lý định kỳ: CRUD, bật/tắt, thống kê, scheduler tự tạo giao dịch.

### 1.3 Kiến trúc chi tiết hệ thống

#### Tổng quan kiến trúc
- Frontend: React Native + Expo, giao tiếp REST API qua `httpClient`.
- Backend: Spring Boot theo tầng Controller → Service → Repository → MySQL.
- Scheduler: chạy theo cron ở backend để tự động tạo giao dịch định kỳ.

#### Luồng kết nối
- FE gọi API qua base URL cấu hình tại `API_CONFIG`.
- BE chạy theo context path `/finma`.
- Mọi API trả về theo wrapper `ApiResponse` (mã `code`, `message`, `result`).
- Xác thực: `SecurityUtils` lấy `userId` từ JWT claim `uid` hoặc fallback username/email.

### 1.4 Code đáp ứng chức năng (lớp, hàm, CSDL, API)

#### A. Quản lý danh mục

**Backend (Spring Boot)**
- Controller:
  - `CategoryController` — [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/controller/category/CategoryController.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/controller/category/CategoryController.java)
  - API: `GET /categories`, `GET /categories/{id}`, `POST /categories`, `PUT /categories/{id}`, `DELETE /categories/{id}`.
  - Mô tả: trả về danh sách theo type, lấy chi tiết, tạo/sửa/xóa danh mục cho user hiện tại.
- Service:
  - `CategoryService` — [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/service/category/CategoryService.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/service/category/CategoryService.java)
  - Mô tả: kiểm tra trùng tên, vòng lặp parent, quyền sở hữu; dựng cây danh mục theo parent.
- Repository:
  - `CategoryRepository` — [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/repository/CategoryRepository.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/repository/CategoryRepository.java)
  - Mô tả: query danh mục gốc, truy cập theo quyền, kiểm tra giao dịch tồn tại.
- Mapper:
  - `CategoryMapper` — [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/mapper/CategoryMapper.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/mapper/CategoryMapper.java)
  - Mô tả: map DTO ↔ entity, trả về `ParentInfo` và children.
- DTO:
  - `CategoryRequest` — [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/request/category/CategoryRequest.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/request/category/CategoryRequest.java)
  - `CategoryResponse` — [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/response/category/CategoryResponse.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/response/category/CategoryResponse.java)
- Enum:
  - `CategoryType` — [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/enums/CategoryType.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/enums/CategoryType.java)

**Frontend (React Native)**
- API:
  - `categoryApi` — [Finma_FE/src/api/categoryApi.ts](Finma_FE/src/api/categoryApi.ts)
  - Mô tả: map `CategoryType` ↔ group UI, chuẩn hóa icon, gọi CRUD danh mục.
- Screen:
  - `CategoryTransactionsScreen` — [Finma_FE/src/screens/category/CategoryTransactionsScreen.tsx](Finma_FE/src/screens/category/CategoryTransactionsScreen.tsx)
  - Mô tả: hiển thị giao dịch theo danh mục, sửa/xóa danh mục và lọc giao dịch theo `categoryId`.
- Types:
  - [Finma_FE/src/types/category.ts](Finma_FE/src/types/category.ts)

**CSDL**
- Bảng `categories`:
  - Các trường chính: `id`, `user_id`, `name`, `type`, `parent_id`, `icon`, `color`, `is_default`, `created_at`, `updated_at`.
  - Dữ liệu mẫu: [seed_data .sql](seed_data%20.sql).

#### B. Quản lý vay nợ

**Backend (Spring Boot)**
- Controller:
  - `DebtController` — [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/controller/debt/DebtController.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/controller/debt/DebtController.java)
  - `DebtPaymentController` — [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/controller/debt/DebtPaymentController.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/controller/debt/DebtPaymentController.java)
  - API: `GET /debts`, `GET /debts/{id}`, `POST /debts`, `PUT /debts/{id}`, `DELETE /debts/{id}`, `GET /debts/stats`, `GET|POST /debts/{id}/payments`, `PUT|DELETE /debts/{id}/payments/{paymentId}`.
- Service:
  - `DebtService` — [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/service/debt/DebtService.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/service/debt/DebtService.java)
  - `DebtPaymentService` — [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/service/debt/DebtPaymentService.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/service/debt/DebtPaymentService.java)
  - `DebtCommonService` — [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/service/debt/DebtCommonService.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/service/debt/DebtCommonService.java)
  - Mô tả: kiểm tra quyền sở hữu, kiểm tra số tiền thanh toán và cập nhật trạng thái nợ.
- Repository:
  - `DebtRepository` — [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/repository/DebtRepository.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/repository/DebtRepository.java)
  - `DebtPaymentRepository` — [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/repository/DebtPaymentRepository.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/repository/DebtPaymentRepository.java)
  - Mô tả: tính tổng đã trả, tổng đang vay/cho vay, truy vấn theo user và trạng thái.
- Mapper:
  - `DebtMapper` — [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/mapper/DebtMapper.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/mapper/DebtMapper.java)
  - `DebtPaymentMapper` — [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/mapper/DebtPaymentMapper.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/mapper/DebtPaymentMapper.java)
- DTO:
  - `DebtCreateRequest` — [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/request/debt/DebtCreateRequest.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/request/debt/DebtCreateRequest.java)
  - `DebtUpdateRequest` — [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/request/debt/DebtUpdateRequest.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/request/debt/DebtUpdateRequest.java)
  - `DebtPaymentCreateRequest` — [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/request/debt/DebtPaymentCreateRequest.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/request/debt/DebtPaymentCreateRequest.java)
  - `DebtPaymentUpdateRequest` — [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/request/debt/DebtPaymentUpdateRequest.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/request/debt/DebtPaymentUpdateRequest.java)
  - `DebtResponse` — [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/response/debt/DebtResponse.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/response/debt/DebtResponse.java)
  - `DebtSumaryResponse` — [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/response/debt/DebtSumaryResponse.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/response/debt/DebtSumaryResponse.java)
  - `DebtPaymentResponse` — [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/response/debt/DebtPaymentResponse.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/response/debt/DebtPaymentResponse.java)
  - `DebtStatsResponse` — [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/response/debt/DebtStatsResponse.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/response/debt/DebtStatsResponse.java)
- Enum:
  - `DebtType` — [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/enums/DebtType.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/enums/DebtType.java)
  - `DebtStatus` — [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/enums/DebtStatus.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/enums/DebtStatus.java)

**Frontend (React Native)**
- API:
  - `debtApi` — [Finma_FE/src/api/debtApi.ts](Finma_FE/src/api/debtApi.ts)
  - Mô tả: map `LEND/LOAN` ↔ `lend/borrow`, chuẩn hóa ngày, tính tổng đã trả và còn lại.
- Screen:
  - `DebtsScreen` — [Finma_FE/src/screens/category/DebtsScreen.tsx](Finma_FE/src/screens/category/DebtsScreen.tsx)
  - Mô tả: hiển thị danh sách, chi tiết, thêm/sửa khoản nợ và giao dịch thanh toán.
- Types:
  - [Finma_FE/src/types/debt.ts](Finma_FE/src/types/debt.ts)

**CSDL**
- Bảng `debts`:
  - Các trường chính: `id`, `user_id`, `person_name`, `type`, `total_amount`, `interest_rate`, `start_date`, `due_date`, `status`, `note`, `created_at`, `updated_at`.
- Bảng `debt_payments`:
  - Các trường chính: `id`, `debt_id`, `amount`, `payment_date`, `title`, `counterparty`, `created_at`, `updated_at`.

#### C. Quản lý định kỳ

**Backend (Spring Boot)**
- Controller:
  - `RecurringTransactionController` — [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/controller/recurringTransaction/RecurringTransactionController.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/controller/recurringTransaction/RecurringTransactionController.java)
  - API: `GET /recurring-transactions`, `GET /recurring-transactions/{id}`, `POST /recurring-transactions`, `PUT /recurring-transactions/{id}`, `PATCH /recurring-transactions/{id}/toggle`, `DELETE /recurring-transactions/{id}`, `GET /recurring-transactions/stats`.
- Service:
  - `RecurringTransactionService` — [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/service/RecurringTransactionService/RecurringTransactionService.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/service/RecurringTransactionService/RecurringTransactionService.java)
  - Mô tả: validate chu kỳ, gán account/category, toggle trạng thái.
- Repository:
  - `RecurringTransactionRepository` — [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/repository/RecurringTransactionRepository.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/repository/RecurringTransactionRepository.java)
  - Mô tả: truy vấn theo user/status, tính tổng chi hàng tháng, lấy danh sách đến hạn.
- Mapper:
  - `RecurringTransactionMapper` — [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/mapper/RecurringTransactionMapper.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/mapper/RecurringTransactionMapper.java)
  - Mô tả: gắn nhãn chu kỳ và lịch thực thi cho FE.
- DTO:
  - `RecurringTransactionCreateRequest` — [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/request/recurringTransaction/RecurringTransactionCreateRequest.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/request/recurringTransaction/RecurringTransactionCreateRequest.java)
  - `RecurringTransactionUpdateRequest` — [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/request/recurringTransaction/RecurringTransactionUpdateRequest.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/request/recurringTransaction/RecurringTransactionUpdateRequest.java)
  - `RecurringTransactionToggleRequest` — [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/request/recurringTransaction/RecurringTransactionToggleRequest.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/request/recurringTransaction/RecurringTransactionToggleRequest.java)
  - `RecurringTransactionResponse` — [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/response/recurringTransaction/RecurringTransactionResponse.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/response/recurringTransaction/RecurringTransactionResponse.java)
  - `RecurringTransactionSummaryResponse` — [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/response/recurringTransaction/RecurringTransactionSummaryResponse.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/response/recurringTransaction/RecurringTransactionSummaryResponse.java)
  - `RecurringTransactionStatsResponse` — [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/response/recurringTransaction/RecurringTransactionStatsResponse.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/response/recurringTransaction/RecurringTransactionStatsResponse.java)
- Enum:
  - `RecurringStatus` — [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/enums/RecurringStatus.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/enums/RecurringStatus.java)
  - `Frequency` — [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/enums/Frequency.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/enums/Frequency.java)
- Scheduler:
  - `RecurringTransactionScheduler` — [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/util/RecurringTransactionScheduler.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/util/RecurringTransactionScheduler.java)
  - Mô tả: tự tạo giao dịch đến hạn, tránh trùng theo marker.

**Frontend (React Native)**
- API:
  - `recurringApi` — [Finma_FE/src/api/recurringApi.ts](Finma_FE/src/api/recurringApi.ts)
  - Mô tả: chuẩn hóa chu kỳ, build payload theo API BE.
- Screen:
  - `RecurringTransactionsScreen` — [Finma_FE/src/screens/category/RecurringTransactionsScreen.tsx](Finma_FE/src/screens/category/RecurringTransactionsScreen.tsx)
  - Mô tả: quản lý danh sách, form tạo/sửa, toggle trạng thái.
- Types:
  - [Finma_FE/src/types/recurring.ts](Finma_FE/src/types/recurring.ts)

**CSDL**
- Bảng `recurring_transactions`:
  - Các trường chính: `id`, `user_id`, `account_id`, `category_id`, `amount`, `title`, `note`, `frequency`,
    `day_of_month`, `day_of_week`, `start_date`, `reminder_days_before`, `is_active`, `status`, `created_at`, `updated_at`.

---

## Phần 2: Phần code

### 2.1 Tối ưu và Upload code / link GitHub
- Link GitHub: https://github.com/mjcpj1811/Finma
- Mô tả repo: chứa cả Backend (Spring Boot) và Frontend (React Native/Expo), cấu hình môi trường, dữ liệu seed và tài nguyên UI.
- Đề xuất tối ưu (chưa triển khai trong phạm vi báo cáo):
  - Thêm index cho các truy vấn thống kê: `debts(user_id, status, type)`, `recurring_transactions(user_id, status, is_active, start_date)`, `categories(user_id, type, parent_id)`.
  - Giảm N+1: tối ưu fetch payments/danh mục theo nhu cầu (join fetch hoặc batch size).
  - Cache kết quả thống kê dashboard theo user trong thời gian ngắn để giảm tải DB.

### 2.2 Các file liên quan đến nội dung cá nhân thực hiện

**Quản lý danh mục**
- Backend:
  - [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/controller/category/CategoryController.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/controller/category/CategoryController.java)
  - [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/service/category/CategoryService.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/service/category/CategoryService.java)
  - [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/repository/CategoryRepository.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/repository/CategoryRepository.java)
  - [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/entity/Category.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/entity/Category.java)
  - [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/mapper/CategoryMapper.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/mapper/CategoryMapper.java)
  - [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/request/category/CategoryRequest.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/request/category/CategoryRequest.java)
  - [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/response/category/CategoryResponse.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/response/category/CategoryResponse.java)
  - [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/enums/CategoryType.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/enums/CategoryType.java)
- Frontend:
  - [Finma_FE/src/api/categoryApi.ts](Finma_FE/src/api/categoryApi.ts)
  - [Finma_FE/src/screens/category/CategoryTransactionsScreen.tsx](Finma_FE/src/screens/category/CategoryTransactionsScreen.tsx)
  - [Finma_FE/src/types/category.ts](Finma_FE/src/types/category.ts)

**Quản lý vay nợ**
- Backend:
  - [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/controller/debt/DebtController.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/controller/debt/DebtController.java)
  - [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/controller/debt/DebtPaymentController.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/controller/debt/DebtPaymentController.java)
  - [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/service/debt/DebtService.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/service/debt/DebtService.java)
  - [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/service/debt/DebtPaymentService.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/service/debt/DebtPaymentService.java)
  - [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/service/debt/DebtCommonService.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/service/debt/DebtCommonService.java)
  - [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/entity/Debt.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/entity/Debt.java)
  - [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/entity/DebtPayment.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/entity/DebtPayment.java)
  - [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/repository/DebtRepository.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/repository/DebtRepository.java)
  - [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/repository/DebtPaymentRepository.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/repository/DebtPaymentRepository.java)
  - [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/mapper/DebtMapper.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/mapper/DebtMapper.java)
  - [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/mapper/DebtPaymentMapper.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/mapper/DebtPaymentMapper.java)
  - [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/request/debt/DebtCreateRequest.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/request/debt/DebtCreateRequest.java)
  - [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/request/debt/DebtUpdateRequest.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/request/debt/DebtUpdateRequest.java)
  - [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/request/debt/DebtPaymentCreateRequest.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/request/debt/DebtPaymentCreateRequest.java)
  - [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/request/debt/DebtPaymentUpdateRequest.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/request/debt/DebtPaymentUpdateRequest.java)
  - [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/response/debt/DebtResponse.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/response/debt/DebtResponse.java)
  - [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/response/debt/DebtSumaryResponse.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/response/debt/DebtSumaryResponse.java)
  - [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/response/debt/DebtPaymentResponse.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/response/debt/DebtPaymentResponse.java)
  - [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/response/debt/DebtStatsResponse.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/response/debt/DebtStatsResponse.java)
  - [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/enums/DebtType.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/enums/DebtType.java)
  - [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/enums/DebtStatus.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/enums/DebtStatus.java)
- Frontend:
  - [Finma_FE/src/api/debtApi.ts](Finma_FE/src/api/debtApi.ts)
  - [Finma_FE/src/screens/category/DebtsScreen.tsx](Finma_FE/src/screens/category/DebtsScreen.tsx)
  - [Finma_FE/src/types/debt.ts](Finma_FE/src/types/debt.ts)

**Quản lý định kỳ**
- Backend:
  - [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/controller/recurringTransaction/RecurringTransactionController.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/controller/recurringTransaction/RecurringTransactionController.java)
  - [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/service/RecurringTransactionService/RecurringTransactionService.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/service/RecurringTransactionService/RecurringTransactionService.java)
  - [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/repository/RecurringTransactionRepository.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/repository/RecurringTransactionRepository.java)
  - [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/entity/RecurringTransaction.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/entity/RecurringTransaction.java)
  - [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/mapper/RecurringTransactionMapper.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/mapper/RecurringTransactionMapper.java)
  - [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/request/recurringTransaction/RecurringTransactionCreateRequest.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/request/recurringTransaction/RecurringTransactionCreateRequest.java)
  - [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/request/recurringTransaction/RecurringTransactionUpdateRequest.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/request/recurringTransaction/RecurringTransactionUpdateRequest.java)
  - [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/request/recurringTransaction/RecurringTransactionToggleRequest.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/request/recurringTransaction/RecurringTransactionToggleRequest.java)
  - [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/response/recurringTransaction/RecurringTransactionResponse.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/response/recurringTransaction/RecurringTransactionResponse.java)
  - [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/response/recurringTransaction/RecurringTransactionSummaryResponse.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/response/recurringTransaction/RecurringTransactionSummaryResponse.java)
  - [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/response/recurringTransaction/RecurringTransactionStatsResponse.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/dto/response/recurringTransaction/RecurringTransactionStatsResponse.java)
  - [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/enums/RecurringStatus.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/enums/RecurringStatus.java)
  - [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/enums/Frequency.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/enums/Frequency.java)
  - [Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/util/RecurringTransactionScheduler.java](Finma_BE/Finma_BE/src/main/java/com/example/Finma_BE/util/RecurringTransactionScheduler.java)
- Frontend:
  - [Finma_FE/src/api/recurringApi.ts](Finma_FE/src/api/recurringApi.ts)
  - [Finma_FE/src/screens/category/RecurringTransactionsScreen.tsx](Finma_FE/src/screens/category/RecurringTransactionsScreen.tsx)
  - [Finma_FE/src/types/recurring.ts](Finma_FE/src/types/recurring.ts)

### 2.3 Yêu cầu comment code
- Ưu tiên comment các đoạn có logic nghiệp vụ quan trọng: validate chu kỳ, tính tổng đã trả, cập nhật trạng thái nợ, tự tạo giao dịch định kỳ.
- Gợi ý chuẩn comment:
  - Mô tả input/output, điều kiện lỗi và mã lỗi trả về.
  - Mô tả tác động dữ liệu (update trạng thái, tạo bản ghi, phát sinh giao dịch).

---

## Hướng dẫn và các lưu ý khi cài đặt, triển khai

### Backend (Spring Boot)
1. Cài Java 17 và Maven.
2. Tạo CSDL MySQL `finance_app`.
3. Chạy script seed: [seed_data .sql](seed_data%20.sql).
4. Cập nhật cấu hình ở [Finma_BE/Finma_BE/src/main/resources/application.yaml](Finma_BE/Finma_BE/src/main/resources/application.yaml) (DB, mail, OAuth, JWT).
5. Chạy BE: `mvn spring-boot:run` (context path `/finma`, port 8080).

### Frontend (React Native / Expo)
1. Cài Node.js + npm.
2. Vào thư mục Finma_FE.
3. Chạy `npm install`.
4. Chạy `npm run web` hoặc `npm run android/ios`.
5. Kiểm tra base URL ở [Finma_FE/src/api/config.ts](Finma_FE/src/api/config.ts) trùng với BE.

### Lưu ý khi triển khai
- `@EnableScheduling` đã bật trong ứng dụng BE để scheduler định kỳ hoạt động.
- JWT cần có claim `uid` để ánh xạ đúng user; nếu thiếu sẽ fallback theo username/email.
- Nếu dùng OAuth (Google/Facebook) cần thiết lập biến môi trường tương ứng.
- Khi đổi môi trường, cập nhật base URL ở FE và DB config ở BE.
