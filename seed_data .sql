use finance_app;
-- ============================================================
-- SEED DATA SCRIPT - Finance App
-- Nhóm: 09 - PTIT
-- Mô tả: Xóa dữ liệu cũ và thêm dữ liệu mẫu đầy đủ
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- XÓA DỮ LIỆU CŨ
-- ============================================================
TRUNCATE TABLE `chat_messages`;
TRUNCATE TABLE `chat_sessions`;
TRUNCATE TABLE `notifications`;
TRUNCATE TABLE `debt_payments`;
TRUNCATE TABLE `debts`;
TRUNCATE TABLE `recurring_transactions`;
TRUNCATE TABLE `transactions`;
TRUNCATE TABLE `budgets`;
TRUNCATE TABLE `goals`;
TRUNCATE TABLE `categories`;
TRUNCATE TABLE `accounts`;
TRUNCATE TABLE `users`;
TRUNCATE TABLE `invalidated_token`;
TRUNCATE TABLE `password_reset_token`;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 1. USERS
-- Mật khẩu gốc: Password@123 (hash bcrypt)
-- ============================================================
INSERT INTO `users` (`id`, `email`, `phone`, `password`, `full_name`, `avatar`, `dob`, `job`, `currency`, `timezone`, `status`, `username`) VALUES
(1, 'khanh.truong@gmail.com', '0901234561', '$2a$10$0gIy96/oOw0ROfsUIXxxU.RvPjY/pLr6aiYaUtYJU9a0hMuYjJKB.', 'Trương Nam Khánh', NULL, '2004-05-15', 'Sinh viên', 'VND', 'Asia/Ho_Chi_Minh', 1, 'namkhanh'),
(2, 'my.le@gmail.com',        '0901234562', '$2a$10$0gIy96/oOw0ROfsUIXxxU.RvPjY/pLr6aiYaUtYJU9a0hMuYjJKB.', 'Lê Trà My',        NULL, '2004-08-20', 'Sinh viên', 'VND', 'Asia/Ho_Chi_Minh', 1, 'tramy'),
(3, 'minh.dinh@gmail.com',    '0901234563', '$2a$10$0gIy96/oOw0ROfsUIXxxU.RvPjY/pLr6aiYaUtYJU9a0hMuYjJKB.', 'Đinh Hữu Minh',    NULL, '2004-11-10', 'Sinh viên', 'VND', 'Asia/Ho_Chi_Minh', 1, 'huuminh');

-- ============================================================
-- 2. ACCOUNTS
-- ============================================================
INSERT INTO `accounts` (`id`, `user_id`, `name`, `type`, `balance`, `icon`, `color`) VALUES
(1,  1, 'Tiền mặt',    'CASH',      5000000.00, 'wallet',    '#4CAF50'),
(2,  1, 'Vietcombank', 'BANK',     15000000.00, 'bank',      '#1565C0'),
(3,  1, 'MoMo',        'E_WALLET',  2000000.00, 'mobile',    '#E91E8C'),
(4,  1, 'Tiết kiệm',   'SAVING',   30000000.00, 'piggy-bank','#FF9800'),
(5,  2, 'Tiền mặt',    'CASH',      3000000.00, 'wallet',    '#4CAF50'),
(6,  2, 'Techcombank', 'BANK',      8000000.00, 'bank',      '#E53935'),
(7,  2, 'ZaloPay',     'E_WALLET',  1500000.00, 'mobile',    '#1E88E5'),
(8,  3, 'Tiền mặt',    'CASH',      4500000.00, 'wallet',    '#4CAF50'),
(9,  3, 'BIDV',        'BANK',     20000000.00, 'bank',      '#1B5E20'),
(10, 3, 'VNPay',       'E_WALLET',   500000.00, 'mobile',    '#B71C1C');

-- ============================================================
-- 3. CATEGORIES MẶC ĐỊNH (is_default = 1, không thể xóa)
--
-- "Tài Chính / Chi Tiêu / Thu Nhập" là nhóm hiển thị UI,
-- KHÔNG phải bản ghi trong DB.
--
-- Danh mục EXPENSE được phân biệt qua field type:
--   Nhóm "Tài Chính" trên UI: Tiết Kiệm, Định Kỳ, Vay Nợ
--   Nhóm "Chi Tiêu"  trên UI: Thực Phẩm, Ăn Uống, Quà Tặng,
--                              Y Tế, Giải Trí, Di Chuyển
-- Danh mục INCOME:
--   Nhóm "Thu Nhập"  trên UI: Lương, Trợ Cấp
-- ============================================================

-- ─── USER 1 ─────────────────────────────────────────────────
INSERT INTO `categories` (`id`, `user_id`, `name`, `type`, `parent_id`, `icon`, `color`, `is_default`) VALUES
-- Tài Chính
( 1, 1, 'Tiết Kiệm',  'FINANCE', NULL, 'piggy-bank',    '#4DB6E6', 1),
( 2, 1, 'Định Kỳ',    'FINANCE', NULL, 'calendar-sync', '#4DB6E6', 1),
( 3, 1, 'Vay Nợ',     'FINANCE', NULL, 'debt',          '#4DB6E6', 1),
-- Chi Tiêu
( 4, 1, 'Thực Phẩm',  'EXPENSE', NULL, 'grocery',       '#4DB6E6', 1),
( 5, 1, 'Ăn Uống',    'EXPENSE', NULL, 'restaurant',    '#4DB6E6', 1),
( 6, 1, 'Quà Tặng',   'EXPENSE', NULL, 'gift',          '#4DB6E6', 1),
( 7, 1, 'Y Tế',       'EXPENSE', NULL, 'medical',       '#4DB6E6', 1),
( 8, 1, 'Giải Trí',   'EXPENSE', NULL, 'entertainment', '#4DB6E6', 1),
( 9, 1, 'Di Chuyển',  'EXPENSE', NULL, 'transport',     '#4DB6E6', 1),
-- Thu Nhập
(10, 1, 'Lương',      'INCOME',  NULL, 'salary',        '#66BB6A', 1),
(11, 1, 'Trợ Cấp',    'INCOME',  NULL, 'subsidy',       '#66BB6A', 1);

-- ─── USER 2 ─────────────────────────────────────────────────
INSERT INTO `categories` (`id`, `user_id`, `name`, `type`, `parent_id`, `icon`, `color`, `is_default`) VALUES
(12, 2, 'Tiết Kiệm',  'FINANCE', NULL, 'piggy-bank',    '#4DB6E6', 1),
(13, 2, 'Định Kỳ',    'FINANCE', NULL, 'calendar-sync', '#4DB6E6', 1),
(14, 2, 'Vay Nợ',     'FINANCE', NULL, 'debt',          '#4DB6E6', 1),
(15, 2, 'Thực Phẩm',  'EXPENSE', NULL, 'grocery',       '#4DB6E6', 1),
(16, 2, 'Ăn Uống',    'EXPENSE', NULL, 'restaurant',    '#4DB6E6', 1),
(17, 2, 'Quà Tặng',   'EXPENSE', NULL, 'gift',          '#4DB6E6', 1),
(18, 2, 'Y Tế',       'EXPENSE', NULL, 'medical',       '#4DB6E6', 1),
(19, 2, 'Giải Trí',   'EXPENSE', NULL, 'entertainment', '#4DB6E6', 1),
(20, 2, 'Di Chuyển',  'EXPENSE', NULL, 'transport',     '#4DB6E6', 1),
(21, 2, 'Lương',      'INCOME',  NULL, 'salary',        '#66BB6A', 1),
(22, 2, 'Trợ Cấp',    'INCOME',  NULL, 'subsidy',       '#66BB6A', 1);

-- ─── USER 3 ─────────────────────────────────────────────────
INSERT INTO `categories` (`id`, `user_id`, `name`, `type`, `parent_id`, `icon`, `color`, `is_default`) VALUES
(23, 3, 'Tiết Kiệm',  'FINANCE', NULL, 'piggy-bank',    '#4DB6E6', 1),
(24, 3, 'Định Kỳ',    'FINANCE', NULL, 'calendar-sync', '#4DB6E6', 1),
(25, 3, 'Vay Nợ',     'FINANCE', NULL, 'debt',          '#4DB6E6', 1),
(26, 3, 'Thực Phẩm',  'EXPENSE', NULL, 'grocery',       '#4DB6E6', 1),
(27, 3, 'Ăn Uống',    'EXPENSE', NULL, 'restaurant',    '#4DB6E6', 1),
(28, 3, 'Quà Tặng',   'EXPENSE', NULL, 'gift',          '#4DB6E6', 1),
(29, 3, 'Y Tế',       'EXPENSE', NULL, 'medical',       '#4DB6E6', 1),
(30, 3, 'Giải Trí',   'EXPENSE', NULL, 'entertainment', '#4DB6E6', 1),
(31, 3, 'Di Chuyển',  'EXPENSE', NULL, 'transport',     '#4DB6E6', 1),
(32, 3, 'Lương',      'INCOME',  NULL, 'salary',        '#66BB6A', 1),
(33, 3, 'Trợ Cấp',    'INCOME',  NULL, 'subsidy',       '#66BB6A', 1);

-- ============================================================
-- 4. GOALS
-- ============================================================
INSERT INTO `goals` (`id`, `user_id`, `name`, `target_amount`, `start_date`, `end_date`, `status`, `icon`, `color`, `description`) VALUES
(1, 1, 'Mua laptop mới',    20000000.00, '2026-01-01', '2026-12-31', 'IN_PROGRESS', 'laptop',     '#1565C0', 'Tiết kiệm mua MacBook Air M3'),
(2, 1, 'Du lịch Đà Nẵng',  10000000.00, '2026-01-01', '2026-07-01', 'IN_PROGRESS', 'travel',     '#00897B', 'Chuyến đi hè cùng nhóm bạn'),
(3, 2, 'Quỹ khẩn cấp',      15000000.00, '2026-01-01', '2026-12-31', 'IN_PROGRESS', 'shield',     '#E53935', 'Dự phòng 3 tháng chi tiêu'),
(4, 2, 'Học phí học kỳ 2',   8000000.00, '2026-01-01', '2026-06-01', 'IN_PROGRESS', 'education',  '#7B1FA2', 'Đóng học phí kỳ 2 năm 4'),
(5, 3, 'Mua xe máy',         35000000.00, '2026-01-01', '2026-12-31', 'IN_PROGRESS', 'motorcycle', '#E65100', 'Honda Wave Alpha mới'),
(6, 3, 'Du học Nhật Bản',  200000000.00, '2026-01-01', '2027-12-31', 'IN_PROGRESS', 'globe',      '#1A237E', 'Chi phí du học 1 năm tại Nhật');

-- ============================================================
-- 5. TRANSACTIONS (Tháng 3 & 4/2026)
-- ============================================================
-- User 1 - Khánh
INSERT INTO `transactions` (`user_id`, `account_id`, `category_id`, `goal_id`, `type`, `amount`, `note`, `transaction_date`) VALUES
(1, 2, 10, NULL, 'INCOME',  3000000.00, 'Lương part-time lập trình tháng 3',  '2026-03-05 08:00:00'),
(1, 2, 11, NULL, 'INCOME',   800000.00, 'Trợ cấp học bổng tháng 3',           '2026-03-10 09:00:00'),
(1, 2, 10, NULL, 'INCOME',  3000000.00, 'Lương part-time lập trình tháng 4',  '2026-04-05 08:00:00'),
(1, 2,  2, NULL, 'EXPENSE', 1500000.00, 'Tiền phòng tháng 3',                 '2026-03-01 08:00:00'),
(1, 2,  2, NULL, 'EXPENSE', 1500000.00, 'Tiền phòng tháng 4',                 '2026-04-01 08:00:00'),
(1, 1,  5, NULL, 'EXPENSE',  250000.00, 'Ăn trưa cả tuần',                    '2026-03-03 12:00:00'),
(1, 1,  5, NULL, 'EXPENSE',  180000.00, 'Cà phê với bạn',                     '2026-03-07 15:30:00'),
(1, 3,  9, NULL, 'EXPENSE',   50000.00, 'Grab đi học',                        '2026-03-08 07:30:00'),
(1, 1,  4, NULL, 'EXPENSE',  350000.00, 'Đi chợ cuối tuần',                   '2026-03-10 17:00:00'),
(1, 1,  7, NULL, 'EXPENSE',  200000.00, 'Khám sức khỏe định kỳ',              '2026-03-15 09:00:00'),
(1, 3,  8, NULL, 'EXPENSE',  150000.00, 'Xem phim cuối tuần',                 '2026-03-16 19:00:00'),
(1, 1,  5, NULL, 'EXPENSE',  350000.00, 'Ăn sinh nhật bạn',                   '2026-03-20 19:00:00'),
(1, 2,  1,  1,   'SAVING',  1000000.00, 'Tiết kiệm mua laptop',               '2026-03-25 10:00:00'),
(1, 2,  1,  2,   'SAVING',   500000.00, 'Tiết kiệm du lịch Đà Nẵng',          '2026-03-25 10:05:00'),
(1, 1,  5, NULL, 'EXPENSE',  200000.00, 'Ăn sáng & trưa đầu tháng 4',        '2026-04-02 07:30:00'),
(1, 3,  9, NULL, 'EXPENSE',   80000.00, 'Grab đi phỏng vấn',                  '2026-04-03 08:00:00');

-- User 2 - My
INSERT INTO `transactions` (`user_id`, `account_id`, `category_id`, `goal_id`, `type`, `amount`, `note`, `transaction_date`) VALUES
(2, 6, 21, NULL, 'INCOME',  2500000.00, 'Lương gia sư tháng 3',               '2026-03-05 09:00:00'),
(2, 6, 22, NULL, 'INCOME',   500000.00, 'Trợ cấp học bổng khoa tháng 3',      '2026-03-10 09:00:00'),
(2, 6, 21, NULL, 'INCOME',  2500000.00, 'Lương gia sư tháng 4',               '2026-04-05 09:00:00'),
(2, 5, 16, NULL, 'EXPENSE',  200000.00, 'Ăn trưa cả tuần',                    '2026-03-04 12:00:00'),
(2, 7, 20, NULL, 'EXPENSE',   60000.00, 'Vé xe bus tháng 3',                  '2026-03-01 07:00:00'),
(2, 5, 17, NULL, 'EXPENSE',  300000.00, 'Quà sinh nhật mẹ',                   '2026-03-18 10:00:00'),
(2, 5, 18, NULL, 'EXPENSE',  120000.00, 'Mua thuốc đau đầu',                  '2026-03-25 11:00:00'),
(2, 6, 12,  3,   'SAVING',   500000.00, 'Tiết kiệm quỹ khẩn cấp',             '2026-03-28 10:00:00'),
(2, 6, 12,  4,   'SAVING',  1000000.00, 'Để dành học phí học kỳ 2',           '2026-03-28 10:05:00'),
(2, 5, 16, NULL, 'EXPENSE',  180000.00, 'Ăn sáng & trưa đầu tháng 4',        '2026-04-02 07:30:00'),
(2, 7, 20, NULL, 'EXPENSE',   60000.00, 'Vé xe bus tháng 4',                  '2026-04-01 07:00:00');

-- User 3 - Minh
INSERT INTO `transactions` (`user_id`, `account_id`, `category_id`, `goal_id`, `type`, `amount`, `note`, `transaction_date`) VALUES
(3, 9, 32, NULL, 'INCOME',  4000000.00, 'Lương thực tập tháng 3',             '2026-03-05 08:00:00'),
(3, 9, 33, NULL, 'INCOME',  1000000.00, 'Trợ cấp đi lại thực tập',           '2026-03-10 08:00:00'),
(3, 9, 32, NULL, 'INCOME',  4000000.00, 'Lương thực tập tháng 4',             '2026-04-05 08:00:00'),
(3, 9, 24, NULL, 'EXPENSE', 2000000.00, 'Tiền phòng tháng 3',                 '2026-03-01 08:00:00'),
(3, 9, 24, NULL, 'EXPENSE', 2000000.00, 'Tiền phòng tháng 4',                 '2026-04-01 08:00:00'),
(3, 8, 27, NULL, 'EXPENSE',  300000.00, 'Ăn trưa văn phòng',                  '2026-03-04 12:00:00'),
(3, 10,31, NULL, 'EXPENSE',  200000.00, 'Grab đi làm cả tuần',                '2026-03-06 07:30:00'),
(3, 8, 29, NULL, 'EXPENSE',  350000.00, 'Thuốc cảm cúm',                      '2026-03-14 10:00:00'),
(3, 8, 30, NULL, 'EXPENSE',  200000.00, 'Xem bóng đá cùng bạn',               '2026-03-16 20:00:00'),
(3, 9, 23,  5,   'SAVING',  1500000.00, 'Tiết kiệm mua xe máy',               '2026-03-25 10:00:00'),
(3, 9, 23,  6,   'SAVING',  2000000.00, 'Quỹ du học Nhật Bản',                '2026-03-25 10:05:00'),
(3, 8, 27, NULL, 'EXPENSE',  250000.00, 'Ăn sáng đầu tháng 4',               '2026-04-02 07:00:00'),
(3, 10,31, NULL, 'EXPENSE',  150000.00, 'Grab đi làm tuần đầu tháng 4',      '2026-04-03 07:30:00');

-- ============================================================
-- 6. BUDGETS (Tháng 4/2026)
-- ============================================================
INSERT INTO `budgets` (`user_id`, `category_id`, `amount_limit`, `period_type`, `start_date`, `end_date`, `is_recurring`, `parent_budget_id`) VALUES
(1,  5, 1500000.00, 'MONTHLY', '2026-04-01', '2026-04-30', b'1', NULL),
(1,  4,  800000.00, 'MONTHLY', '2026-04-01', '2026-04-30', b'1', NULL),
(1,  9,  300000.00, 'MONTHLY', '2026-04-01', '2026-04-30', b'1', NULL),
(1,  8,  500000.00, 'MONTHLY', '2026-04-01', '2026-04-30', b'1', NULL),
(2, 16, 1000000.00, 'MONTHLY', '2026-04-01', '2026-04-30', b'1', NULL),
(2, 20,  200000.00, 'MONTHLY', '2026-04-01', '2026-04-30', b'1', NULL),
(3, 27, 1200000.00, 'MONTHLY', '2026-04-01', '2026-04-30', b'1', NULL),
(3, 31,  400000.00, 'MONTHLY', '2026-04-01', '2026-04-30', b'1', NULL);

-- ============================================================
-- 7. RECURRING TRANSACTIONS
-- ============================================================
INSERT INTO `recurring_transactions` (`user_id`, `account_id`, `category_id`, `goal_id`, `amount`, `title`, `note`, `frequency`, `day_of_month`, `day_of_week`, `start_date`, `reminder_days_before`, `is_active`, `status`) VALUES
(1, 2,  2, NULL, 1500000.00, 'Tiền phòng hàng tháng',   'Thanh toán tiền phòng trọ',        'MONTHLY', 1,  NULL, '2026-01-01', 3, 1, 'ACTIVE'),
(1, 2, 10, NULL, 3000000.00, 'Nhận lương part-time',     'Lương lập trình thuê',             'MONTHLY', 5,  NULL, '2026-01-01', 1, 1, 'ACTIVE'),
(1, 2,  1,  1,  1000000.00, 'Tiết kiệm laptop',          'Tự động tiết kiệm cuối tháng',    'MONTHLY', 25, NULL, '2026-01-01', 2, 1, 'ACTIVE'),
(1, 2,  1,  2,   500000.00, 'Tiết kiệm du lịch',         'Tự động tiết kiệm cuối tháng',    'MONTHLY', 25, NULL, '2026-01-01', 2, 1, 'ACTIVE'),
(2, 6, 21, NULL, 2500000.00, 'Lương gia sư',              'Nhận lương dạy thêm hàng tháng',  'MONTHLY', 5,  NULL, '2026-01-01', 1, 1, 'ACTIVE'),
(2, 7, 20, NULL,   60000.00, 'Vé xe bus tháng',           'Đổi vé xe bus đầu tháng',         'MONTHLY', 1,  NULL, '2026-01-01', 3, 1, 'ACTIVE'),
(2, 6, 12,  3,   500000.00, 'Tiết kiệm quỹ khẩn cấp',   'Tự động tiết kiệm cuối tháng',    'MONTHLY', 28, NULL, '2026-01-01', 2, 1, 'ACTIVE'),
(3, 9, 24, NULL, 2000000.00, 'Tiền phòng hàng tháng',    'Thanh toán tiền phòng',            'MONTHLY', 1,  NULL, '2026-01-01', 3, 1, 'ACTIVE'),
(3, 9, 32, NULL, 4000000.00, 'Lương thực tập',            'Nhận lương thực tập hàng tháng',  'MONTHLY', 5,  NULL, '2026-01-01', 1, 1, 'ACTIVE'),
(3, 9, 23,  5,  1500000.00, 'Tiết kiệm mua xe',           'Tự động tiết kiệm cuối tháng',   'MONTHLY', 25, NULL, '2026-01-01', 2, 1, 'ACTIVE');

-- ============================================================
-- 8. DEBTS
-- ============================================================
INSERT INTO `debts` (`id`, `user_id`, `person_name`, `type`, `total_amount`, `interest_rate`, `start_date`, `due_date`, `status`, `note`) VALUES
(1, 1, 'Nguyễn Văn An',   'LOAN', 2000000.00, 0.00, '2026-02-01', '2026-05-01', 'ONGOING', 'Mượn tiền mua tài liệu học'),
(2, 1, 'Trần Minh Quân',  'LEND',  500000.00, 0.00, '2026-03-10', '2026-04-10', 'ONGOING', 'Cho bạn mượn tiền ăn trưa'),
(3, 2, 'Lê Văn Đức',      'LOAN', 3000000.00, 0.00, '2026-01-15', '2026-06-15', 'ONGOING', 'Vay tiền mua điện thoại'),
(4, 3, 'Phạm Thanh Hùng', 'LEND', 5000000.00, 5.00, '2026-01-01', '2026-07-01', 'ONGOING', 'Cho bạn vay vốn kinh doanh nhỏ');

-- ============================================================
-- 9. DEBT PAYMENTS
-- ============================================================
INSERT INTO `debt_payments` (`debt_id`, `amount`, `payment_date`) VALUES
(1, 500000.00,  '2026-03-01'),
(1, 500000.00,  '2026-04-01'),
(3, 1000000.00, '2026-02-15'),
(3, 1000000.00, '2026-03-15'),
(4, 1000000.00, '2026-02-01'),
(4, 1000000.00, '2026-03-01');

-- ============================================================
-- 10. NOTIFICATIONS
-- ============================================================
INSERT INTO `notifications` (`user_id`, `title`, `content`, `type`, `is_read`) VALUES
(1, 'Nhắc nhở tiết kiệm',     'Đã đến ngày tiết kiệm định kỳ cho mục tiêu Laptop. Hãy chuyển 1,000,000 VND.',    'RECURRING_REMINDER', 0),
(1, 'Cảnh báo ngân sách',     'Bạn đã dùng 85% ngân sách Ăn Uống tháng này. Hãy chi tiêu cẩn thận hơn!',        'BUDGET_ALERT',       0),
(1, 'Khoản nợ sắp đến hạn',   'Khoản vay từ Nguyễn Văn An đến hạn 01/05/2026. Còn 25 ngày.',                    'DEBT_REMINDER',      0),
(2, 'Tiến độ mục tiêu',       'Quỹ khẩn cấp đã đạt 33%. Hãy tiếp tục duy trì thói quen tiết kiệm!',             'GOAL_PROGRESS',      0),
(2, 'Giao dịch vừa ghi nhận', 'Chi tiêu 180,000 VND cho danh mục Ăn Uống vừa được ghi nhận.',                   'TRANSACTION',        1),
(3, 'Nhắc nhở tiết kiệm',     'Đã đến ngày tiết kiệm cho mục tiêu Mua xe. Hãy chuyển 1,500,000 VND.',           'RECURRING_REMINDER', 0),
(3, 'Khoản cho vay chưa thu', 'Phạm Thanh Hùng chưa thanh toán kỳ tháng 4. Hạn trả: 01/04/2026.',               'DEBT_REMINDER',      0);

-- ============================================================
-- 11. CHAT SESSIONS & MESSAGES
-- ============================================================
INSERT INTO `chat_sessions` (`id`, `user_id`) VALUES
(1, 1),
(2, 2);

INSERT INTO `chat_messages` (`session_id`, `role`, `content`) VALUES
(1, 'user',      'Tôi nên phân bổ ngân sách như thế nào với thu nhập 3 triệu/tháng?'),
(1, 'assistant', 'Với thu nhập 3 triệu/tháng, bạn có thể áp dụng quy tắc 50/30/20: 50% nhu cầu thiết yếu (1.5tr), 30% mong muốn cá nhân (900k), và 20% tiết kiệm (600k). Ưu tiên cắt giảm chi ăn uống và di chuyển trước.'),
(1, 'user',      'Làm sao để tiết kiệm hiệu quả hơn?'),
(1, 'assistant', 'Áp dụng phương pháp "Tiết kiệm trước, tiêu sau": ngay khi nhận lương, chuyển ngay phần tiết kiệm sang tài khoản riêng. Ghi chép mọi chi tiêu hàng ngày để phát hiện các khoản lãng phí.'),
(2, 'user',      'Tôi đang có khoản vay 3 triệu, nên trả như thế nào?'),
(2, 'assistant', 'Với khoản vay 3 triệu không lãi suất, bạn có thể chia đều 500k/tháng trong 6 tháng. Trả đúng hạn để giữ uy tín. Nếu tháng nào dư, hãy trả thêm để giảm áp lực về sau.');

-- ============================================================
-- KIỂM TRA KẾT QUẢ
-- ============================================================
SELECT 'Seed data hoàn tất!' AS status;
SELECT
  (SELECT COUNT(*) FROM users)                           AS total_users,
  (SELECT COUNT(*) FROM accounts)                        AS total_accounts,
  (SELECT COUNT(*) FROM categories WHERE is_default = 1) AS total_default_categories,
  (SELECT COUNT(*) FROM transactions)                    AS total_transactions,
  (SELECT COUNT(*) FROM goals)                           AS total_goals,
  (SELECT COUNT(*) FROM budgets)                         AS total_budgets,
  (SELECT COUNT(*) FROM debts)                           AS total_debts,
  (SELECT COUNT(*) FROM debt_payments)                   AS total_debt_payments,
  (SELECT COUNT(*) FROM recurring_transactions)          AS total_recurring,
  (SELECT COUNT(*) FROM notifications)                   AS total_notifications;
