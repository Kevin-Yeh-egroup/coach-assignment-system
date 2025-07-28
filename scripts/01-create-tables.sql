-- 教練資料表
CREATE TABLE IF NOT EXISTS coaches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    resume TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 教練專業領域表
CREATE TABLE IF NOT EXISTS coach_specialties (
    id SERIAL PRIMARY KEY,
    coach_id INTEGER REFERENCES coaches(id) ON DELETE CASCADE,
    specialty_category VARCHAR(50) NOT NULL,
    specialty_value VARCHAR(100) NOT NULL,
    custom_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 時間登記表
CREATE TABLE IF NOT EXISTS time_slots (
    id SERIAL PRIMARY KEY,
    coach_id INTEGER REFERENCES coaches(id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 派案紀錄表
CREATE TABLE IF NOT EXISTS assignments (
    id SERIAL PRIMARY KEY,
    time_slot_id INTEGER REFERENCES time_slots(id) ON DELETE CASCADE,
    coach_id INTEGER REFERENCES coaches(id) ON DELETE CASCADE,
    client_name VARCHAR(100) NOT NULL,
    client_contact VARCHAR(100),
    topic TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    actual_duration INTEGER,
    need_followup BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 管理員表
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
