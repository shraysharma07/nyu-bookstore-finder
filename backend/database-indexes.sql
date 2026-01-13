-- Performance indexes for /api/students/search optimization
-- Run this on RDS to improve query performance

-- Indexes for dorm lookups
CREATE INDEX IF NOT EXISTS idx_dorms_name ON dorms(name);

-- Indexes for course lookups
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(code);
CREATE INDEX IF NOT EXISTS idx_courses_professor ON courses(professor);
CREATE INDEX IF NOT EXISTS idx_courses_code_professor ON courses(code, professor);

-- Indexes for course_books (already exists but ensure it's there)
CREATE INDEX IF NOT EXISTS idx_course_books_course ON course_books(course_id);
CREATE INDEX IF NOT EXISTS idx_course_books_book ON course_books(book_id);
CREATE INDEX IF NOT EXISTS idx_course_books_course_book ON course_books(course_id, book_id);

-- Indexes for inventory lookups
CREATE INDEX IF NOT EXISTS idx_inventory_bookstore ON inventory(bookstore_id);
CREATE INDEX IF NOT EXISTS idx_inventory_book ON inventory(book_id);
CREATE INDEX IF NOT EXISTS idx_inventory_bookstore_book ON inventory(bookstore_id, book_id);
CREATE INDEX IF NOT EXISTS idx_inventory_quantity ON inventory(quantity) WHERE quantity > 0;

-- Indexes for bookstore_distances
CREATE INDEX IF NOT EXISTS idx_bookstore_distances_dorm ON bookstore_distances(dorm_id);
CREATE INDEX IF NOT EXISTS idx_bookstore_distances_bookstore ON bookstore_distances(bookstore_id);
CREATE INDEX IF NOT EXISTS idx_bookstore_distances_dorm_bookstore ON bookstore_distances(dorm_id, bookstore_id);

-- Indexes for books
CREATE INDEX IF NOT EXISTS idx_books_subject ON books(subject_id);

-- Composite index for the main query pattern
CREATE INDEX IF NOT EXISTS idx_inventory_bookstore_quantity ON inventory(bookstore_id, book_id, quantity) WHERE quantity > 0;

-- Analyze tables to update statistics
ANALYZE dorms;
ANALYZE courses;
ANALYZE course_books;
ANALYZE inventory;
ANALYZE bookstore_distances;
ANALYZE books;
