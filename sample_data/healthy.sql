-- Healthy PostgreSQL Backup Dump
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (name, email) VALUES
('Aman Sharma', 'aman@example.com'),
('Rohan Verma', 'rohan@example.com'),
('Priya Patel', 'priya@example.com'),
('Kavita Rao', 'kavita@example.com'),
('Vikram Singh', 'vikram@example.com');

INSERT INTO orders (user_id, order_number, amount, status) VALUES
(1, 'ORD-101', 1200.00, 'COMPLETED'),
(2, 'ORD-102', 450.50, 'PENDING'),
(3, 'ORD-103', 3200.00, 'COMPLETED'),
(4, 'ORD-104', 890.00, 'COMPLETED'),
(5, 'ORD-105', 1500.00, 'CANCELLED');

