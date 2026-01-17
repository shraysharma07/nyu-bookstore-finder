-- Clean up old books that are not in the new catalog
-- This removes books that are not linked to any courses via course_books
-- Run this AFTER importing the new catalog

DELETE FROM books 
WHERE id NOT IN (
  SELECT DISTINCT book_id 
  FROM course_books 
  WHERE book_id IS NOT NULL
);

-- Also clean up any orphaned course_books (shouldn't happen, but just in case)
DELETE FROM course_books 
WHERE course_id NOT IN (SELECT id FROM courses)
   OR book_id NOT IN (SELECT id FROM books);
