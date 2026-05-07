-- Phase 9 SQL Schema Update: Advanced Optical Features

-- 1. Eye Test Module (Event-based Prescription Logging)
CREATE TABLE eye_test (
    test_id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) REFERENCES business(business_id),
    customer_id VARCHAR(50) REFERENCES customer(customer_id),
    test_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    doctor_name VARCHAR(255),
    right_sph VARCHAR(20),
    right_cyl VARCHAR(20),
    right_axis VARCHAR(20),
    right_add VARCHAR(20),
    left_sph VARCHAR(20),
    left_cyl VARCHAR(20),
    left_axis VARCHAR(20),
    left_add VARCHAR(20),
    pd VARCHAR(20)
);

-- 2. Repair Module Workflow Engine
CREATE TABLE repair (
    repair_id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) REFERENCES business(business_id),
    customer_id VARCHAR(50) REFERENCES customer(customer_id),
    product_id VARCHAR(50) REFERENCES product(product_id), -- Can be internal or external product mapped
    issue TEXT,
    repair_type VARCHAR(100) CHECK (repair_type IN ('Lens replacement', 'Frame repair', 'Nose pad change', 'Screw fix', 'Other')),
    status VARCHAR(50) CHECK (status IN ('Received', 'In progress', 'Ready', 'Delivered')) DEFAULT 'Received',
    assigned_staff VARCHAR(50) REFERENCES app_user(user_id),
    cost DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Customer Loyalty & Rewards System
CREATE TABLE loyalty (
    loyalty_id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) REFERENCES business(business_id),
    customer_id VARCHAR(50) REFERENCES customer(customer_id) UNIQUE,
    points INT DEFAULT 0,
    tier VARCHAR(50) CHECK (tier IN ('Silver', 'Gold', 'Platinum')) DEFAULT 'Silver',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Appointment Booking Engine
CREATE TABLE appointment (
    appointment_id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) REFERENCES business(business_id),
    customer_id VARCHAR(50) REFERENCES customer(customer_id),
    showroom_id VARCHAR(50) REFERENCES showroom(showroom_id),
    appointment_date TIMESTAMP NOT NULL,
    appointment_type VARCHAR(100) CHECK (appointment_type IN ('Eye test', 'Frame selection', 'Repair visit', 'Pickup')),
    status VARCHAR(50) CHECK (status IN ('Booked', 'Confirmed', 'Completed', 'Cancelled')) DEFAULT 'Booked',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
