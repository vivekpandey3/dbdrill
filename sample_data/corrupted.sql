-- Corrupted PostgreSQL Dump Simulation
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150
-- Error: unterminated column definition

INSERT INTO users (name, email) VALUES ('Aman', 'aman@example.com'

-- Error: missing closing bracket and broken statement
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES non_existent_users(id),
    amount NUMERIC
CORRUPTED_RAW_BLOCK_0xDEADBEEF_SYNTAX_ERROR

