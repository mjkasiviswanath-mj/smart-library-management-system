import sqlite3
import os
import hashlib

DB_PATH = os.path.join(os.path.dirname(__file__), 'database.db')

try:
    from werkzeug.security import generate_password_hash
except ImportError:
    def generate_password_hash(password):
        # Werkzeug-compatible fallback
        salt = os.urandom(16).hex()
        dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 260000)
        return f"pbkdf2:sha256:260000${salt}${dk.hex()}"

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# 1. Users Table
cursor.execute('''
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('student', 'admin'))
)
''')

# 2. Books Table
cursor.execute('''
CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    category TEXT NOT NULL,
    isbn TEXT UNIQUE NOT NULL,
    year INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    available_quantity INTEGER NOT NULL
)
''')

# 3. Checkouts Table
cursor.execute('''
CREATE TABLE IF NOT EXISTS checkouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    book_id INTEGER NOT NULL,
    checkout_date TEXT NOT NULL,
    return_date TEXT,
    status TEXT NOT NULL CHECK(status IN ('Borrowed', 'Returned')),
    FOREIGN KEY(student_id) REFERENCES users(id),
    FOREIGN KEY(book_id) REFERENCES books(id)
)
''')

# Predefined Users
users = [
    ('Alex Student', 'student@gmail.com', generate_password_hash('student123'), 'student'),
    ('Library Admin', 'admin@gmail.com', generate_password_hash('admin123'), 'admin')
]

for u in users:
    cursor.execute('''
        INSERT INTO users (name, email, password, role)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET password=excluded.password, name=excluded.name, role=excluded.role
    ''', u)

# Predefined Books
books = [
    ('Artificial Intelligence', 'Stuart Russell', 'Artificial Intelligence', '978-0136042594', 2020, 5, 5),
    ('Deep Learning', 'Ian Goodfellow', 'Artificial Intelligence', '978-0262035613', 2016, 4, 4),
    ('Clean Code', 'Robert C. Martin', 'Programming', '978-0132350884', 2008, 6, 5),
    ('Introduction to Algorithms', 'Thomas H. Cormen', 'Programming', '978-0262033848', 2009, 4, 4),
    ('Database System Concepts', 'Abraham Silberschatz', 'Database', '978-0078022159', 2019, 5, 5),
    ('Computer Networks', 'Andrew S. Tanenbaum', 'Networks', '978-0132126953', 2010, 3, 3),
    ('Operating System Concepts', 'Abraham Silberschatz', 'Operating Systems', '978-1118063330', 2018, 4, 4),
    ('Python Crash Course', 'Eric Matthes', 'Programming', '978-1593279288', 2019, 5, 5),
    ('Java: The Complete Reference', 'Herbert Schildt', 'Programming', '978-1260440232', 2018, 4, 4),
    ('Data Science from Scratch', 'Joel Grus', 'Data Science', '978-1492041139', 2019, 4, 4)
]

for b in books:
    cursor.execute('''
        INSERT OR IGNORE INTO books (title, author, category, isbn, year, quantity, available_quantity)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', b)

# Seed initial checkout
cursor.execute('''
    INSERT OR IGNORE INTO checkouts (id, student_id, book_id, checkout_date, return_date, status)
    VALUES (1, 1, 3, '2026-09-15', NULL, 'Borrowed')
''')

conn.commit()
conn.close()
print("SQLite database successfully created and seeded at:", DB_PATH)
