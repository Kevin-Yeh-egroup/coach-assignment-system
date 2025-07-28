-- 插入測試教練資料
INSERT INTO coaches (name, resume) VALUES 
('張美玲', '社會工作碩士，專精兒童與青少年輔導，具有10年實務經驗'),
('李志明', '臨床心理師，專長家庭治療與婚姻諮商，8年執業經驗'),
('王淑芬', '社工師，專精老人福利服務，曾任職於多家長照機構'),
('陳建華', '精神科社工師，專長成癮防治與精神健康服務');

-- 插入專業領域資料
INSERT INTO coach_specialties (coach_id, specialty_category, specialty_value) VALUES
(1, 'service_target', '兒童與少年福利'),
(1, 'service_method', '個案工作'),
(1, 'service_method', '團體工作'),
(2, 'service_target', '婦女與性別議題'),
(2, 'service_field', '醫務社會工作'),
(2, 'service_method', '家庭工作'),
(3, 'service_target', '老人福利'),
(3, 'service_field', '社區工作'),
(4, 'service_field', '精神健康與成癮防治'),
(4, 'special_skills', '保護性服務');

-- 插入管理員資料
INSERT INTO admins (username, name) VALUES 
('admin', '系統管理員');

-- 插入測試時間段
INSERT INTO time_slots (coach_id, start_time, end_time, status) VALUES
(1, '2024-01-15 09:00:00', '2024-01-15 10:00:00', 'available'),
(1, '2024-01-15 14:00:00', '2024-01-15 15:30:00', 'assigned'),
(2, '2024-01-16 10:30:00', '2024-01-16 11:30:00', 'available'),
(3, '2024-01-17 13:00:00', '2024-01-17 14:00:00', 'confirmed');

-- 插入測試派案
INSERT INTO assignments (time_slot_id, coach_id, client_name, client_contact, topic, status) VALUES
(2, 1, '林小華', '0912345678', '青少年學習適應問題', 'pending'),
(4, 3, '陳阿嬤', '0987654321', '老人憂鬱情緒支持', 'confirmed');
