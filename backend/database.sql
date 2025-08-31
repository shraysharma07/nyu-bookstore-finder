-- Create database
CREATE DATABASE nyu_book_finder;

-- Connect to the database
\c nyu_book_finder;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Bookstores table
CREATE TABLE bookstores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    address TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dorms table
CREATE TABLE dorms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subjects table
CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses table
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    subject_id INT REFERENCES subjects(id),
    professor VARCHAR(255),
    semester VARCHAR(20),
    year INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(code, professor, semester, year)
);

-- Books table
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    author VARCHAR(255) NOT NULL,
    isbn VARCHAR(20),
    subject_id INT REFERENCES subjects(id),
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory table (books available at each bookstore)
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    bookstore_id INT REFERENCES bookstores(id) ON DELETE CASCADE,
    book_id INT REFERENCES books(id) ON DELETE CASCADE,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    availability_status VARCHAR(50) DEFAULT 'In Stock',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(bookstore_id, book_id)
);

-- Course books (which books are needed for which courses)
CREATE TABLE course_books (
    id SERIAL PRIMARY KEY,
    course_id INT REFERENCES courses(id) ON DELETE CASCADE,
    book_id INT REFERENCES books(id) ON DELETE CASCADE,
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, book_id)
);

-- Bookstore distances from dorms (precomputed for performance)
CREATE TABLE bookstore_distances (
    id SERIAL PRIMARY KEY,
    bookstore_id INT REFERENCES bookstores(id) ON DELETE CASCADE,
    dorm_id INT REFERENCES dorms(id) ON DELETE CASCADE,
    distance_minutes INT NOT NULL,
    walking_distance VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(bookstore_id, dorm_id)
);

-- Student searches (for analytics)
CREATE TABLE student_searches (
    id SERIAL PRIMARY KEY,
    student_name VARCHAR(255),
    dorm_id INT REFERENCES dorms(id),
    course_id INT REFERENCES courses(id),
    search_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET
);

-- Insert initial data

-- Insert dorms
INSERT INTO dorms (name, address) VALUES 
('Chamberi', 'Chamberi, Madrid, Spain'),
('Moncloa', 'Moncloa, Madrid, Spain'),
('Malasaña', 'Malasaña, Madrid, Spain');

-- Insert subjects
INSERT INTO subjects (name, code) VALUES 
('Mathematics', 'MATH'),
('Physics', 'PHYS'),
('Chemistry', 'CHEM'),
('Economics', 'ECON'),
('Psychology', 'PSYC'),
('English', 'ENGL'),
('History', 'HIST'),
('Biology', 'BIOL'),
('Computer Science', 'CSCI'),
('Art History', 'ARTH'),
('Philosophy', 'PHIL'),
('Political Science', 'POLS'),
('Sociology', 'SOCI');

-- Insert sample bookstores (password is 'books123' hashed)
INSERT INTO bookstores (name, username, password_hash, phone, address) VALUES 
('Librería Central', 'antonio', '$2a$10$rOvNr8ZfWyYl3rlJc5d8KOGwQS1K9n3bLHVF0kDl8EzKm6WXYZ7UK', '+34 915 21 48 98', 'Calle de Fuencarral, 15, Madrid'),
('Pasajes Internacional', 'pasajes', '$2a$10$rOvNr8ZfWyYl3rlJc5d8KOGwQS1K9n3bLHVF0kDl8EzKm6WXYZ7UK', '+34 914 47 82 34', 'Calle de Sagasta, 8, Madrid');

-- Insert courses
INSERT INTO courses (code, name, subject_id, professor) VALUES 
('MATH-UA 121', 'Calculus I', 1, 'Dr. Rodriguez'),
('PHYS-UA 91', 'Physics I', 2, 'Dr. Garcia'),
('CHEM-UA 125', 'General Chemistry', 3, 'Dr. Morales'),
('ECON-UA 1', 'Principles of Microeconomics', 4, 'Dr. Castro'),
('PSYC-UA 1', 'Introduction to Psychology', 5, 'Dr. Mendoza'),
('ENGL-UA 1', 'Writing the Essay', 6, 'Dr. Thompson'),
('HIST-UA 1', 'Global History', 7, 'Dr. Gutierrez'),
('BIOL-UA 11', 'Principles of Biology', 8, 'Dr. Navarro');

-- Insert books
INSERT INTO books (title, author, isbn, subject_id, is_required) VALUES 
('Calculus: Early Transcendentals', 'James Stewart', '9781337613927', 1, true),
('University Physics with Modern Physics', 'Young & Freedman', '9780135159552', 2, true),
('Chemistry: The Central Science', 'Brown, LeMay, Bursten', '9780134414232', 3, true),
('Principles of Economics', 'N. Gregory Mankiw', '9781337516853', 4, true),
('Psychology: The Science of Mind and Behaviour', 'Passer & Smith', '9780077174446', 5, true),
('The Norton Field Guide to Writing', 'Richard Bullock', '9780393617412', 6, true),
('A History of World Societies', 'McKay, Hill, Buckler', '9781319059446', 7, true),
('Campbell Biology', 'Urry, Cain, Wasserman', '9780134093413', 8, true);

-- Link courses to books
INSERT INTO course_books (course_id, book_id, is_required) VALUES 
(1, 1, true),  -- Calculus -> Stewart book
(2, 2, true),  -- Physics -> Young & Freedman
(3, 3, true),  -- Chemistry -> Brown et al
(4, 4, true),  -- Economics -> Mankiw
(5, 5, true),  -- Psychology -> Passer & Smith
(6, 6, true),  -- Writing -> Norton Field Guide
(7, 7, true),  -- History -> McKay et al
(8, 8, true);  -- Biology -> Campbell

-- Add inventory for bookstores
INSERT INTO inventory (bookstore_id, book_id, price, quantity, availability_status) VALUES 
(1, 1, 299.99, 3, 'In Stock'),    -- Librería Central - Calculus
(1, 2, 349.99, 2, 'In Stock'),    -- Librería Central - Physics
(1, 3, 389.99, 1, 'Limited Stock'),
(1, 4, 279.99, 4, 'In Stock'),
(1, 5, 319.99, 2, 'In Stock'),
(2, 1, 295.00, 2, 'In Stock'),    -- Pasajes Internacional - Calculus
(2, 4, 275.00, 3, 'In Stock'),    -- Pasajes Internacional - Economics
(2, 5, 310.00, 1, 'In Stock'),    -- Pasajes Internacional - Psychology
(2, 6, 129.99, 5, 'In Stock'),
(2, 7, 399.99, 1, 'Limited Stock');

-- Add bookstore distances from dorms
INSERT INTO bookstore_distances (bookstore_id, dorm_id, distance_minutes, walking_distance) VALUES 
(1, 1, 3, '3 min walk'),   -- Librería Central from Chamberi
(1, 2, 8, '8 min walk'),   -- Librería Central from Moncloa  
(1, 3, 6, '6 min walk'),   -- Librería Central from Malasaña
(2, 1, 5, '5 min walk'),   -- Pasajes from Chamberi
(2, 2, 12, '12 min walk'), -- Pasajes from Moncloa
(2, 3, 8, '8 min walk');   -- Pasajes from Malasaña

-- Create indexes for better performance
CREATE INDEX idx_inventory_bookstore ON inventory(bookstore_id);
CREATE INDEX idx_inventory_book ON inventory(book_id);
CREATE INDEX idx_course_books_course ON course_books(course_id);
CREATE INDEX idx_course_books_book ON course_books(book_id);
CREATE INDEX idx_bookstore_distances_dorm ON bookstore_distances(dorm_id);
CREATE INDEX idx_student_searches_timestamp ON student_searches(search_timestamp);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to update updated_at automatically
CREATE TRIGGER update_bookstores_updated_at BEFORE UPDATE ON bookstores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();